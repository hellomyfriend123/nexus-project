import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('header notification/category contracts use backend ids and methods', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const original = globalThis.fetch;
  try {
    const { headerApi } = await server.ssrLoadModule('/src/services/api/header.ts');
    let last;
    globalThis.fetch = async (url, options) => { last = { url, options }; return Response.json([{ id: 'parent', name: 'Parent', description: null, parentId: null, status: 'ACTIVE', sortOrder: 0, children: [{ id: 'child', name: 'Child', description: null, parentId: 'parent', status: 'ACTIVE', sortOrder: 0, children: [] }] }]); };
    assert.deepEqual((await headerApi.categories()).map(row => row.id), ['parent', 'child']);
    assert.ok(last.url.endsWith('/api/v1/catalog/categories'));
    globalThis.fetch = async (url, options) => { last = { url, options }; return Response.json(url.endsWith('/cart') ? { id: 'cart', buyerId: 'buyer', status: 'ACTIVE', subtotal: 0, itemCount: 0, items: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' } : { content: [], totalElements: 0 }); };
    await headerApi.notifications(); assert.ok(last.url.endsWith('/notification/notifications?size=5'));
    await headerApi.unreadCount(); assert.ok(last.url.endsWith('/notification/notifications/unread-count'));
    await headerApi.notification('id/one'); assert.ok(last.url.endsWith('/notification/notifications/id%2Fone'));
    await headerApi.read('id/one'); assert.ok(last.url.endsWith('/notification/notifications/id%2Fone/read')); assert.equal(last.options.method, 'PATCH');
    await headerApi.readAll(); assert.ok(last.url.endsWith('/notification/notifications/read-all')); assert.equal(last.options.method, 'PATCH');
    await headerApi.cart(); assert.ok(last.url.endsWith('/buyer/commerce/cart'));
  } finally { globalThis.fetch = original; await server.close(); }
});
