import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('cart scope rejects old responses and prevents queued calls using a changed session', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { CartRequestScope } = await server.ssrLoadModule('/src/features/cart/utils/cartRequestScope.ts');
    const { CartMutationQueue } = await server.ssrLoadModule('/src/features/cart/utils/cartMutationQueue.ts');
    let token = 'A';
    const scope = new CartRequestScope(token, () => token);
    let resolve;
    const pending = scope.bind(() => new Promise(r => { resolve = r; }))();
    token = 'B';
    resolve({ id: 'private-cart-A' });
    await assert.rejects(pending, { name: 'AbortError' });
    let calls = 0;
    await assert.rejects(scope.bind(async () => { calls++; })(), { name: 'AbortError' });
    assert.equal(calls, 0);

    token = 'A';
    const queue = new CartMutationQueue({ updateQuantity: scope.bind(async () => { calls++; }), removeItem: scope.bind(async () => { calls++; }), fetchCart: scope.bind(async () => { calls++; }) });
    queue.syncFromServer([{ id: 'line-A', quantity: 1 }]);
    queue.setQuantity('line-A', 2);
    token = 'B';
    await queue.settle();
    queue.dispose();
    assert.equal(calls, 0, 'old queued PUT must not reach the transport under account B');

    token = 'A';
    const pendingBeforeCleanup = scope.bind(() => new Promise(r => { resolve = r; }))();
    scope.dispose(); scope.activate();
    resolve('obsolete mount');
    await assert.rejects(pendingBeforeCleanup, { name: 'AbortError' });
    assert.equal(await scope.bind(async () => 'current mount')(), 'current mount');
  } finally { await server.close(); }
});

test('refresh accepts only the latest request with an unchanged mutation revision and session', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { CartRequestScope } = await server.ssrLoadModule('/src/features/cart/utils/cartRequestScope.ts');
    let token = 'A'; let revision = 0;
    const scope = new CartRequestScope(token, () => token);
    const older = scope.beginRefresh(revision, () => revision);
    const newer = scope.beginRefresh(revision, () => revision);
    assert.equal(newer(), true);
    assert.equal(older(), false);
    revision++;
    assert.equal(newer(), false, 'a completed mutation invalidates in-flight enrichment');
    const afterMutation = scope.beginRefresh(revision, () => revision);
    assert.equal(afterMutation(), true);
    token = null;
    assert.equal(afterMutation(), false);
  } finally { await server.close(); }
});

test('mixed-seller checkout is disabled with an explanation; single-seller checkout stays available', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Summary } = await server.ssrLoadModule('/src/features/cart/components/OrderSummary.tsx');
    const props = { totals: { directCount: 2, directSubtotal: 200, total: 200 }, voucher: null, voucherInput: '', hasItems: true };
    const blocked = renderToStaticMarkup(createElement(Summary, { ...props, blockedReason: 'Chỉ một người bán' }));
    assert.match(blocked, /class="nx-cart-cta-button" disabled=""/);
    assert.match(blocked, /aria-describedby="cart-checkout-restriction"/);
    assert.match(blocked, /Chỉ một người bán/);
    const enabled = renderToStaticMarkup(createElement(Summary, props));
    assert.doesNotMatch(enabled, /class="nx-cart-cta-button" disabled/);
  } finally { await server.close(); }
});
