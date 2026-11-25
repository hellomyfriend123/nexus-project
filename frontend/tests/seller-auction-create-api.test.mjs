import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { readFile, readdir } from 'node:fs/promises';
const sellerId = 'seller';
const product = id => ({ id, sellerId: id === 'other' ? 'other-seller' : sellerId, name: id, description: null, basePrice: 200, categoryId: 'category', categoryName: 'Category', status: 'ACTIVE', images: ['https://example.com/product.jpg'] });
const inventory = (id, productId) => ({ id, productId, skuId: id, skuCode: 'SKU-' + id, skuName: null, warehouseId: 'warehouse', totalQuantity: 1, availableQuantity: 1, status: 'ACTIVE' });

test('create auction loads seller inventory, deduplicates products, and sends only supported API fields', async () => {
 const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
 const original = globalThis.fetch;
 try {
  const service = await server.ssrLoadModule('/src/features/seller-auction/services/auctionService.ts');
  const calls = []; let fail = false;
  globalThis.fetch = async (url, options) => {
   calls.push({ url, options });
   if (fail) return Response.json({ message: 'Rejected by server' }, { status: 403 });
   if (url.includes('/inventories?')) {
    const page = new URL(url, 'http://local').searchParams.get('page');
    return Response.json({ content: page === '0' ? [inventory('one', 'own'), inventory('two', 'own')] : [inventory('three', 'other')], page: Number(page), size: 100, totalElements: 3, totalPages: 2, first: page === '0', last: page === '1' });
   }
   if (url.includes('/products/')) return Response.json(product(url.split('/').at(-1)));
   if (fail) return Response.json({ message: 'Rejected by server' }, { status: 403 });
   return Response.json({ id: 'real-auction', highestBidderId: null, acceptedBidCount: 0, createdAt: '2027-01-01T00:00:00Z', updatedAt: '2027-01-01T00:00:00Z', productId: 'own', sellerId, startingPrice: 100, currentPrice: 100, status: 'SCHEDULED', startTime: '2027-01-01T00:00:00Z', endTime: '2027-01-04T00:00:00Z' });
  };
  const products = await service.getAuctionProducts(sellerId);
  assert.equal(products.length, 1); assert.equal(products[0].id, 'own'); assert.equal(products[0].sku, 'SKU-one, SKU-two');
  assert.equal(calls.filter(c => c.url.endsWith('/catalog/products/own')).length, 1);
  assert.ok(calls.every(c => !c.url.includes('/catalog/products?')));
  const draft = { ...service.createAuctionDraft(), productId: 'own', startingPrice: '100', unsupported: true };
  const now = new Date('2027-01-01T00:00:00Z');
  const created = await service.createAuction(draft, products, now);
  assert.equal(created.id, 'real-auction');
  const mutation = calls.at(-1);
  assert.ok(mutation.url.endsWith('/api/v1/seller/auction/auctions'));
  assert.equal(mutation.options.method, 'POST');
  assert.deepEqual(JSON.parse(mutation.options.body), { productId: 'own', startingPrice: 100, startTime: now.toISOString(), endTime: '2027-01-04T00:00:00.000Z' });
  const count = calls.length;
  await assert.rejects(service.createAuction({ ...draft, productId: 'other' }, products, now), /kho/);
  await assert.rejects(service.createAuction({ ...draft, startingPrice: 'Infinity' }, products, now), /hữu hạn/);
  await assert.rejects(service.createAuction({ ...draft, duration: '0' }, products, now), /Thời lượng/);
  await assert.rejects(service.createAuction({ ...draft, startNow: false, startDate: '2020-01-01', startTime: '00:00' }, products, now), /tương lai/);
  assert.equal(calls.length, count);
  fail = true; await assert.rejects(service.createAuction(draft, products, now), /Rejected by server/);
  await assert.rejects(service.getAuctionProducts(sellerId), /Rejected by server/);
 } finally { globalThis.fetch = original; await server.close(); }
});

test('create flow has loading, empty, error, duplicate-submit protection and real-ID links without fake persistence', async () => {
 const base = new URL('../src/features/seller-auction/', import.meta.url);
 assert.deepEqual(await readdir(new URL('services/', base)), ['auctionService.ts']);
 const hook = await readFile(new URL('hooks/useCreateAuction.ts', base), 'utf8');
 assert.match(hook, /lock.current \|\| created/); assert.match(hook, /const auction = await createAuction\(draft, products\); if \(current\(\)\) setCreated\(auction\)/);
 assert.match(hook, /const current = \(\) => attempt === revision.current && key === sessionKey\(\)/); assert.doesNotMatch(hook, /saveMock|FileReader|localStorage/);
 const feedback = await readFile(new URL('components/AuctionFeedback.tsx', base), 'utf8');
 assert.match(feedback, /encodeURIComponent\(hub.created.id\)/); assert.match(feedback, /hub.created.status/);
 const productSection = await readFile(new URL('components/AuctionProductSection.tsx', base), 'utf8');
 assert.match(productSection, /hub.loading/); assert.match(productSection, /hub.loadError/); assert.match(productSection, /!products.length/);
 const sidebar = await readFile(new URL('components/AuctionSidebar.tsx', base), 'utf8');
 assert.match(sidebar, /disabled title="API chưa hỗ trợ lưu bản nháp"/);
});

