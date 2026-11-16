import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { notify, toastStore } from '../src/shared/components/Toast/toast.ts';
afterEach(() => { for (const toast of toastStore.getSnapshot()) toastStore.remove(toast.id); });

test('store is empty at startup and has a stable empty SSR snapshot', () => {
  assert.equal(toastStore.getSnapshot().length, 0);
  assert.strictEqual(toastStore.getServerSnapshot(), toastStore.getServerSnapshot());
  notify.info('client only');
  assert.equal(toastStore.getServerSnapshot().length, 0);
});
test('deduplicates IDs, stacks newest first, and unsubscribes listeners', () => {
  let calls = 0;
  const unsubscribe = toastStore.subscribe(() => calls++);
  notify.success('saved', { toastId: 'save' });
  notify.success('duplicate', { toastId: 'save' });
  assert.equal(calls, 1);
  const id = notify.error('failure');
  assert.equal(toastStore.getSnapshot()[0].id, id);
  assert.equal(toastStore.getSnapshot()[0].autoClose, false);
  unsubscribe();
  notify.dismiss(id);
  assert.equal(calls, 2);
  assert.equal(toastStore.getSnapshot()[0].leaving, true);
  toastStore.remove(id);
  assert.equal(toastStore.getSnapshot().length, 1);
});
test('loading only changes when updated by real work', () => {
  const id = notify.loading('working');
  assert.equal(toastStore.getSnapshot()[0].autoClose, false);
  notify.update(id, { render: 'done', type: 'success' });
  assert.equal(toastStore.getSnapshot()[0].message, 'done');
  assert.equal(toastStore.getSnapshot()[0].autoClose, 4500);
  notify.dismiss();
  notify.update(id, { render: 'must not revive' });
  assert.equal(toastStore.getSnapshot()[0].message, 'done');
});
test('promise waits for resolution, returns value and updates the same toast', async () => {
  let resolve;
  const task = new Promise(done => { resolve = done; });
  const result = notify.promise(task, { pending: 'saving', success: value => `saved ${value}`, error: 'failed' });
  const id = toastStore.getSnapshot()[0].id;
  assert.equal(toastStore.getSnapshot()[0].type, 'loading');
  resolve(42);
  assert.equal(await result, 42);
  assert.equal(toastStore.getSnapshot()[0].id, id);
  assert.equal(toastStore.getSnapshot()[0].message, 'saved 42');
});
test('promise rejects and preserves persistent failure; sync throws are handled', async () => {
  const reason = new Error('network');
  await assert.rejects(notify.promise(() => { throw reason; }, { pending: 'saving', success: 'done', error: error => error.message }), reason);
  assert.equal(toastStore.getSnapshot()[0].type, 'error');
  assert.equal(toastStore.getSnapshot()[0].autoClose, false);
  assert.equal(toastStore.getSnapshot()[0].message, 'network');
});
