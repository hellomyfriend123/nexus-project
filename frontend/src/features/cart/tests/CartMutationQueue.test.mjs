import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

// Loader: the queue is framework-free, so it is loaded through Vite like the other cart tests.
async function withQueueModule(run) {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try { return await run(await server.ssrLoadModule('/src/features/cart/services/cartMutationQueue.ts')); }
  finally { await server.close(); }
}

const tick = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
const deferred = () => { let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej; }); return { promise, resolve, reject }; };
const httpError = (status, message, code, data) => Object.assign(new Error(message), { status, code, data });

/** Fake backend: authoritative quantities + controllable request completion. */
function createBackend(initial, { stock = {} } = {}) {
  const quantities = new Map(Object.entries(initial));
  const calls = [];
  const gates = new Map();
  const cart = () => ({ id: 'cart', subtotal: 0, itemCount: quantities.size, items: [...quantities].map(([id, quantity]) => ({ id, productId: 'p-' + id, skuId: null, sellerId: 's', quantity, unitPrice: 1000, lineTotal: quantity * 1000 })) });
  const deps = (events = {}, debounceMs = 0) => ({
    debounceMs, events,
    updateQuantity: async (id, quantity) => {
      calls.push({ op: 'PUT', id, quantity });
      const gate = gates.get(id)?.shift();
      if (gate) await gate.promise;
      if (!quantities.has(id)) throw httpError(404, 'Not found');
      if (stock[id] !== undefined && quantity > stock[id]) throw httpError(409, 'Insufficient product inventory', 'INSUFFICIENT_STOCK', { requestedQuantity: quantity, availableQuantity: stock[id] });
      quantities.set(id, quantity);
      return cart();
    },
    removeItem: async id => { calls.push({ op: 'DELETE', id }); quantities.delete(id); },
    fetchCart: async () => { calls.push({ op: 'GET' }); return cart(); },
  });
  const hold = id => { const gate = deferred(); gates.set(id, [...(gates.get(id) ?? []), gate]); return gate; };
  return { quantities, calls, deps, hold, puts: id => calls.filter(c => c.op === 'PUT' && (!id || c.id === id)).map(c => c.quantity) };
}

test('optimistic desired quantity is visible immediately; request is deferred by debounce', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 });
  const queue = new CartMutationQueue(backend.deps({}, 30));
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 5);
  assert.equal(queue.getSnapshot('a').desiredQuantity, 5);
  assert.equal(queue.getSnapshot('a').confirmedQuantity, 2);
  assert.equal(queue.getSnapshot('a').syncState, 'pending');
  assert.deepEqual(backend.calls, []);
  await queue.settle();
  assert.deepEqual(backend.puts(), [5]);
  assert.equal(queue.getSnapshot('a').confirmedQuantity, 5);
  assert.equal(queue.getSnapshot('a').syncState, 'synced');
  assert.equal(backend.quantities.get('a'), 5);
  queue.dispose();
}));

test('rapid consecutive increases and decreases coalesce into one request', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2, b: 9 });
  const queue = new CartMutationQueue(backend.deps({}, 20));
  queue.syncFromServer([{ id: 'a', quantity: 2 }, { id: 'b', quantity: 9 }]);
  for (const q of [3, 4, 5, 6]) queue.setQuantity('a', q);
  for (const q of [8, 7, 6, 5]) queue.setQuantity('b', q);
  await queue.settle();
  assert.deepEqual(backend.puts('a'), [6]);
  assert.deepEqual(backend.puts('b'), [5]);
  assert.equal(backend.quantities.get('a'), 6);
  assert.equal(backend.quantities.get('b'), 5);
  queue.dispose();
}));

test('no redundant request when the desired value returns to the confirmed value', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 });
  const queue = new CartMutationQueue(backend.deps({}, 10));
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 3); queue.setQuantity('a', 2);
  await queue.settle(); await tick(30);
  assert.deepEqual(backend.calls, []);
  assert.equal(queue.getSnapshot('a').syncState, 'synced');
  queue.dispose();
}));

test('new interaction during an in-flight request: only latest value is sent afterwards', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 });
  const gate = backend.hold('a');
  const queue = new CartMutationQueue(backend.deps({}, 0));
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 4);
  await tick();
  assert.deepEqual(backend.puts('a'), [4]);
  queue.setQuantity('a', 5); queue.setQuantity('a', 6); queue.setQuantity('a', 7); // intermediate values skipped
  await tick();
  assert.deepEqual(backend.puts('a'), [4], 'only one in-flight request per item');
  assert.equal(queue.getSnapshot('a').desiredQuantity, 7);
  assert.equal(queue.getSnapshot('a').syncState, 'syncing');
  gate.resolve();
  await queue.settle();
  assert.deepEqual(backend.puts('a'), [4, 7]);
  assert.equal(backend.quantities.get('a'), 7);
  assert.equal(queue.getSnapshot('a').confirmedQuantity, 7);
  queue.dispose();
}));

test('items have independent queues; responses may complete out of order', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 1, b: 1 });
  const gateA = backend.hold('a');
  const queue = new CartMutationQueue(backend.deps({}, 0));
  queue.syncFromServer([{ id: 'a', quantity: 1 }, { id: 'b', quantity: 1 }]);
  queue.setQuantity('a', 3); await tick();
  queue.setQuantity('b', 4); await tick();
  assert.equal(queue.getSnapshot('b').syncState, 'synced', 'b finished while a is still in flight');
  assert.equal(queue.getSnapshot('a').syncState, 'syncing');
  gateA.resolve();
  await queue.settle();
  assert.equal(queue.getSnapshot('a').confirmedQuantity, 3);
  assert.equal(queue.getSnapshot('b').confirmedQuantity, 4);
  assert.equal(backend.quantities.get('a'), 3);
  assert.equal(backend.quantities.get('b'), 4);
  queue.dispose();
}));

test('insufficient stock without newer interaction reconciles to the server quantity and does not retry', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 }, { stock: { a: 5 } });
  const reconciled = [];
  const queue = new CartMutationQueue(backend.deps({ onReconciled: (id, quantity, info) => reconciled.push({ id, quantity, info }) }, 0));
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 7);
  await queue.settle(); await tick(20);
  assert.deepEqual(backend.puts('a'), [7], 'rejected quantity is not retried');
  assert.deepEqual(reconciled, [{ id: 'a', quantity: 2, info: { reason: 'stock', availableQuantity: 5 } }]);
  const snapshot = queue.getSnapshot('a');
  assert.equal(snapshot.desiredQuantity, 2);
  assert.equal(snapshot.maxQuantity, 5);
  assert.equal(snapshot.stockState, 'insufficient');
  assert.equal(snapshot.syncState, 'synced');
  queue.dispose();
}));

test('insufficient stock with a newer interaction: older response does not overwrite it', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 }, { stock: { a: 5 } });
  const gate = backend.hold('a');
  const reconciled = [];
  const queue = new CartMutationQueue(backend.deps({ onReconciled: (...args) => reconciled.push(args) }, 0));
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 7); await tick();
  queue.setQuantity('a', 9); // newer interaction while 7 is in flight
  gate.resolve();
  await queue.settle();
  assert.deepEqual(backend.puts('a'), [7, 5], 'newer value is clamped to authoritative stock, not dropped');
  assert.equal(backend.quantities.get('a'), 5);
  assert.equal(queue.getSnapshot('a').confirmedQuantity, 5);
  assert.deepEqual(reconciled, []);
  queue.dispose();
}));

test('out of stock marks the item and keeps the confirmed quantity', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 1 }, { stock: { a: 0 } });
  const queue = new CartMutationQueue(backend.deps({}, 0));
  queue.syncFromServer([{ id: 'a', quantity: 1 }]);
  queue.setQuantity('a', 2);
  await queue.settle();
  assert.equal(queue.getSnapshot('a').stockState, 'out_of_stock');
  assert.equal(queue.getSnapshot('a').desiredQuantity, 1);
  queue.dispose();
}));

test('network failure keeps the desired quantity, reports error, and retry succeeds', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 });
  const errors = [];
  const base = backend.deps({ onError: (id, message) => errors.push({ id, message }) }, 0);
  let fail = true;
  const queue = new CartMutationQueue({ ...base, updateQuantity: async (id, q) => { if (fail) { backend.calls.push({ op: 'PUT', id, quantity: q }); throw httpError(0, 'Không thể kết nối máy chủ.'); } return base.updateQuantity(id, q); } });
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 6);
  await queue.settle();
  assert.equal(queue.getSnapshot('a').syncState, 'error');
  assert.equal(queue.getSnapshot('a').desiredQuantity, 6);
  assert.equal(queue.getSnapshot('a').confirmedQuantity, 2);
  assert.equal(errors.length, 1);
  assert.equal((await queue.settle()).ok, false, 'unsynchronized data is never reported as ok');
  fail = false;
  queue.retry('a');
  assert.equal((await queue.settle()).ok, true);
  assert.equal(backend.quantities.get('a'), 6);
  assert.equal(queue.getSnapshot('a').syncState, 'synced');
  queue.dispose();
}));

test('an older failure does not roll back a newer interaction', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 });
  const gate = backend.hold('a');
  const base = backend.deps({}, 0);
  let first = true;
  const queue = new CartMutationQueue({ ...base, updateQuantity: async (id, q) => { if (first) { first = false; backend.calls.push({ op: 'PUT', id, quantity: q }); await gate.promise; throw httpError(0, 'offline'); } return base.updateQuantity(id, q); } });
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 4); await tick();
  queue.setQuantity('a', 8);
  gate.resolve();
  await queue.settle();
  assert.deepEqual(backend.puts('a'), [4, 8]);
  assert.equal(backend.quantities.get('a'), 8);
  assert.equal(queue.getSnapshot('a').syncState, 'synced');
  queue.dispose();
}));

test('multi-device conflict: fetches authoritative cart and reconciles instead of overwriting', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 });
  const base = backend.deps({}, 0);
  const reconciled = [];
  const queue = new CartMutationQueue({ ...base, events: { onReconciled: (id, q, info) => reconciled.push({ id, q, info }) },
    updateQuantity: async id => { backend.quantities.set(id, 9); throw httpError(409, 'Version conflict', 'VERSION_CONFLICT'); } });
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 3);
  await queue.settle();
  assert.deepEqual(reconciled, [{ id: 'a', q: 9, info: { reason: 'conflict' } }]);
  assert.equal(queue.getSnapshot('a').desiredQuantity, 9);
  assert.equal(queue.getSnapshot('a').confirmedQuantity, 9);
  queue.dispose();
}));

test('item deleted elsewhere (404): item is dropped and reported', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 });
  const reconciled = [];
  const queue = new CartMutationQueue(backend.deps({ onReconciled: (id, q, info) => reconciled.push({ id, q, info }) }, 0));
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  backend.quantities.delete('a');
  queue.setQuantity('a', 3);
  await queue.settle();
  assert.deepEqual(reconciled, [{ id: 'a', q: 0, info: { reason: 'missing' } }]);
  queue.dispose();
}));

test('delete while updates are pending: DELETE waits for in-flight PUT and nothing recreates the item', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 });
  const gate = backend.hold('a');
  const queue = new CartMutationQueue(backend.deps({}, 0));
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 4); await tick();
  queue.setQuantity('a', 6); // pending behind the in-flight PUT
  const removal = queue.remove('a');
  await tick();
  assert.deepEqual(backend.calls.map(c => c.op), ['PUT'], 'DELETE not sent while PUT is in flight');
  gate.resolve();
  await removal;
  await queue.settle(); await tick(20);
  assert.deepEqual(backend.calls.map(c => c.op + (c.quantity ?? '')), ['PUT4', 'DELETE']);
  assert.equal(backend.quantities.has('a'), false);
  assert.equal(queue.getSnapshot('a'), undefined);
  queue.dispose();
}));

test('delete cancels a debounced update that has not been sent yet', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 });
  const queue = new CartMutationQueue(backend.deps({}, 30));
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 5);
  await queue.remove('a'); await tick(60);
  assert.deepEqual(backend.calls.map(c => c.op), ['DELETE']);
  queue.dispose();
}));

test('checkout gate: settle() waits for pending mutations and final state matches the backend', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2, b: 1 });
  let idle = 0;
  const queue = new CartMutationQueue(backend.deps({ onIdle: () => { idle += 1; } }, 50));
  queue.syncFromServer([{ id: 'a', quantity: 2 }, { id: 'b', quantity: 1 }]);
  queue.setQuantity('a', 5); queue.setQuantity('b', 3);
  const { ok } = await queue.settle(); // flushes debounce timers immediately
  assert.equal(ok, true);
  assert.equal(backend.quantities.get('a'), 5);
  assert.equal(backend.quantities.get('b'), 3);
  assert.equal(queue.getSnapshot('a').confirmedQuantity, backend.quantities.get('a'));
  assert.equal(idle, 1);
  queue.dispose();
}));

test('dispose clears pending timers so nothing is sent afterwards', async () => withQueueModule(async ({ CartMutationQueue }) => {
  const backend = createBackend({ a: 2 });
  const queue = new CartMutationQueue(backend.deps({}, 20));
  queue.syncFromServer([{ id: 'a', quantity: 2 }]);
  queue.setQuantity('a', 5);
  queue.dispose();
  await tick(60);
  assert.deepEqual(backend.calls, []);
}));
