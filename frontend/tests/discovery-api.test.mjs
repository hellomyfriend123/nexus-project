import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
const storage = () => { const rows = new Map(); return { getItem: key => rows.get(key) ?? null, setItem: (key, value) => rows.set(key, value), removeItem: key => rows.delete(key) }; };
const product = id => ({ id, name: id, basePrice: 100, status: 'ACTIVE', sellerId: 'seller', categoryId: id === 'a' ? 'camera' : 'audio', categoryName: null, primaryImageUrl: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', description: null, images: [] });
const auction = id => ({ id: 'sale-' + id, productId: id, sellerId: 'seller', startingPrice: 100, currentPrice: id === 'a' ? 200 : 300, status: 'ACTIVE', startTime: '2026-01-01T00:00:00Z', endTime: '2099-01-01T00:00:00Z' });
const page = (content, index = 0, total = 1) => ({ content, page: index, size: 100, totalElements: total, totalPages: total, first: index === 0, last: index + 1 >= total });
test('discovery reads every auction page before category/price filtering and local pagination', async () => {
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
    assert.equal(params.get('status'), 'ACTIVE'); assert.equal(params.has('categoryId'), false); assert.equal(params.has('minPrice'), false);
    const index = Number(params.get('page')); return Response.json(page([auction(index ? 'b' : 'a')], index, 2));
   }
   if (url.includes('/products?')) return Response.json(page([product('a'), product('b')]));
   return Response.json(product(url.split('/').at(-1)));
  };
  const filtered = await listDiscoveryProducts({ mode: 'auction', categoryId: 'camera', minPrice: 150, maxPrice: 250, page: 0, size: 1 });
  assert.equal(filtered.totalElements, 1); assert.equal(filtered.totalPages, 1); assert.equal(filtered.content[0].auction.id, 'sale-a');
  assert.equal(calls.filter(url => url.includes('/auction/auctions?')).length, 2);
  const all = await listDiscoveryProducts({ mode: 'all', page: 0, size: 24 });
  assert.equal(all.content[0].auction.id, 'sale-a'); assert.equal(all.content[1].auction.id, 'sale-b');
  assert.equal(calls.filter(url => /\/products\/[^?]+$/.test(url)).length, 2, 'all mode uses summaries without re-fetching unrelated product details');
  const mixedBudget = await listDiscoveryProducts({ mode: 'all', maxPrice: 250, sort: 'basePrice,asc' });
  assert.deepEqual(mixedBudget.content.map(row => row.id), ['a']);
  const mixedPage = await listDiscoveryProducts({ mode: 'all', sort: 'basePrice,desc', size: 1, page: 1 });
  assert.equal(mixedPage.content[0].id, 'a'); assert.equal(mixedPage.totalElements, 2);
  calls.length = 0;
  const direct = await listDiscoveryProducts({ mode: 'buy-now' });
  assert.equal(direct.content[0].auction, undefined); assert.equal(calls.length, 1);
  auth.clearSession(); calls.length = 0;
  const guest = await listDiscoveryProducts({ mode: 'all' }); assert.equal(guest.content.length, 2); assert.equal(calls.length, 1);
  await assert.rejects(listDiscoveryProducts({ mode: 'auction' }), error => error.status === 401);
 } finally {
  globalThis.fetch = original; for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  await server.close();
 }
});
test('auction discovery hooks refresh active data without changing UI markup', async () => {
 const { readFile } = await import('node:fs/promises');
 for (const path of ['home/hooks/useHomeProducts.ts', 'product/hooks/useProductListing.ts']) {
  const source = await readFile(new URL('../src/features/' + path, import.meta.url), 'utf8');
  assert.match(source, /setInterval\(refresh, AUCTION_REFRESH_MS\)/);
  assert.match(source, /clearInterval\(timer\)/); assert.match(source, /controller\?\.abort\(\)/);
  assert.match(source, /visibilityState/); assert.match(source, /current.signal.aborted/);
 }
});


