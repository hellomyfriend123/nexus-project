import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
const storage = () => { const rows = new Map(); return { getItem: key => rows.get(key) ?? null, setItem: (key, value) => rows.set(key, value), removeItem: key => rows.delete(key) }; };
const product = id => ({ id, name: id, basePrice: 100, status: 'ACTIVE', sellerId: 'seller', categoryId: 'camera', categoryName: null, primaryImageUrl: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', description: null, images: [] });
const auction = id => ({ id: 'sale-' + id, productId: id, sellerId: 'seller', startingPrice: 100, currentPrice: 200, status: 'ACTIVE', startTime: '2026-01-01T00:00:00Z', endTime: '2099-01-01T00:00:00Z' });
const page = (content, index = 0) => ({ content, page: index, size: 24, totalElements: 240, totalPages: 10, first: index === 0, last: index === 9 });

test('discovery preserves server pagination without fetching unrelated catalog or auction pages', async () => {
 const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
 const original = globalThis.fetch;
 const descriptors = ['localStorage', 'sessionStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
 for (const [key] of descriptors) Object.defineProperty(globalThis, key, { value: storage(), configurable: true });
 try {
  const auth = await server.ssrLoadModule('/src/services/api/auth.ts');
  auth.saveSession({ userId: 'buyer', email: 'buyer@example.test', fullName: 'Buyer', roles: ['BUYER'], accessToken: 'test-only', tokenType: 'Bearer', expiresAt: new Date(Date.now() + 60000).toISOString() }, false);
  const { listDiscoveryProducts } = await server.ssrLoadModule('/src/services/api/discovery.ts');
  const calls = [];
  globalThis.fetch = async url => {
   calls.push(url);
   if (url.includes('/auction/auctions?')) {
    const params = new URL(url, 'http://example.test').searchParams;
    assert.equal(params.get('status'), 'ACTIVE'); assert.equal(params.get('sort'), 'endTime,asc');
    for (const key of ['categoryId', 'keyword', 'minPrice', 'maxPrice']) assert.equal(params.has(key), false);
    return Response.json(page([auction('a')], Number(params.get('page'))));
   }
   if (url.includes('/products?')) return Response.json(page([product('a')], Number(new URL(url, 'http://example.test').searchParams.get('page'))));
   return Response.json(product(url.split('/').at(-1)));
  };
  const result = await listDiscoveryProducts({ mode: 'auction', page: 3, size: 24, categoryId: 'stale-category', keyword: 'stale search', minPrice: 500 });
  assert.equal(result.page, 3); assert.equal(result.totalPages, 10); assert.equal(result.totalElements, 240);
  assert.equal(result.content[0].auction.id, 'sale-a');
  assert.equal(calls.length, 2, 'one auction page plus details for its one visible item');
  assert.match(calls[0], /page=3/);
  for (const mode of ['buy-now', 'all']) {
   calls.length = 0;
   const catalog = await listDiscoveryProducts({ mode, keyword: 'camera', categoryId: 'camera', minPrice: 50, sort: 'basePrice,asc', page: 4, size: 24 });
   assert.equal(catalog.page, 4); assert.equal(catalog.content[0].auction, undefined); assert.equal(calls.length, 1);
   const query = new URL(calls[0], 'http://example.test').searchParams;
   assert.equal(query.get('keyword'), 'camera'); assert.equal(query.get('categoryId'), 'camera'); assert.equal(query.get('minPrice'), '50'); assert.equal(query.get('sort'), 'basePrice,asc');
  }
  auth.clearSession(); calls.length = 0;
  await assert.rejects(listDiscoveryProducts({ mode: 'auction' }), error => error.status === 401);
  assert.equal(calls.length, 0);
  await listDiscoveryProducts({ mode: 'buy-now' }); assert.equal(calls.length, 1);
 } finally {
  globalThis.fetch = original;
  for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  await server.close();
 }
});
