import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { readFile, readdir } from 'node:fs/promises';
const id = '11111111-1111-1111-1111-111111111111';
const product = { id: 'product', name: 'Real product', basePrice: 100, status: 'ACTIVE', sellerId: 'seller', categoryId: null, categoryName: null, primaryImageUrl: null, createdAt: '2026-01-01T00:00:00Z', images: [], description: null, updatedAt: '2026-01-01T00:00:00Z' };
const auction = { id, productId: 'product', sellerId: 'seller', startingPrice: 100, currentPrice: 200, startTime: '2026-01-01T00:00:00Z', status: 'ENDED', endTime: '2026-01-02T00:00:00Z', acceptedBidCount: 2 };
test('seller result uses real DTOs, handles no settlement, enforces owner, and paginates accepted bids', async () => {
 const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
 const original = globalThis.fetch;
 try {
  const { auctionResultService: service } = await server.ssrLoadModule('/src/features/seller-auction-result/services/auctionResultService.ts');
  const calls = []; let mode = 'WON';
  globalThis.fetch = async (url, options) => {
   calls.push({ url, options });
   if (url.includes('/products/')) return Response.json(product);
   if (url.includes('/orders/')) return Response.json({ id: 'order', orderType: 'AUCTION', status: 'CONFIRMED', receiverName: 'Recipient', receiverPhone: '123', shippingAddress: 'Real address', shippingFee: 10, items: [{ productId: 'product', quantity: 1, skuCodeSnapshot: 'REAL' }] });
   if (url.includes('/settlement')) return mode === 'missing' ? Response.json({ message: 'Not settled' }, { status: 404 }) : mode === 'error' ? Response.json({ message: 'Server error' }, { status: 500 }) : Response.json({ auctionId: id, winnerId: mode === 'NO_BIDS' ? null : 'winner', orderId: mode === 'order' ? 'order' : null, finalPrice: mode === 'NO_BIDS' ? null : 200, status: mode === 'order' ? 'WON' : mode, settledAt: '2026-01-02T00:00:00Z', bidCount: 2 });
   if (url.includes('/bids?')) return Response.json({ content: [{ id: 'bid', auctionId: id, status: 'ACCEPTED', bidderId: 'winner', amount: 200, placedAt: '2026-01-02T00:00:00Z' }], page: url.includes('page=1') ? 1 : 0, size: 10, totalPages: 2, totalElements: 11, first: !url.includes('page=1'), last: url.includes('page=1') });
   return Response.json(auction);
  };
  let result = await service.getResult(id, 'seller');
  assert.equal(result.id, id); assert.equal(result.product.name, 'Real product'); assert.equal(result.winner.name, 'winner'); assert.equal(result.bids[0].winner, true); assert.equal(result.bidTotalPages, 2); assert.match(result.net, /Chưa có dữ liệu/); assert.equal(result.winner.reviews, null);
  await service.bids(id, 1); assert.ok(calls.at(-1).url.endsWith('/bids?page=1&size=10'));
  assert.ok(calls.every(call => !call.options.method || call.options.method === 'GET'));
  const before = calls.length; await assert.rejects(service.getResult(id, 'other'), /không thuộc/); assert.equal(calls.length, before + 1);
  await assert.rejects(service.getResult('bad', 'seller'), /không hợp lệ/);
  mode = 'missing'; result = await service.getResult(id, 'seller'); assert.match(result.title, /Chưa có kết quả/); assert.equal(result.winner.name, 'Chưa có người thắng');
  mode = 'NO_BIDS'; result = await service.getResult(id, 'seller'); assert.match(result.title, /Không có lượt/); assert.ok(result.bids.every(bid => !bid.winner));
  mode = 'order'; result = await service.getResult(id, 'seller'); assert.equal(result.address, 'Real address'); assert.equal(result.product.sku, 'REAL'); assert.match(result.paymentStatus, /CONFIRMED/);
  mode = 'error'; await assert.rejects(service.getResult(id, 'seller'), /Server error/);
  for (const bad of [
   url => url.endsWith('/settlement') ? { auctionId: 'other' } : auction,
   () => ({ ...auction, id: 'other' }),
  ]) {
   globalThis.fetch = async url => Response.json(bad(url));
   await assert.rejects(service.getResult(id, 'seller'), /không hợp lệ/);
  }
  globalThis.fetch = async () => Response.json({ content: [{ id: 'bad', auctionId: 'other', status: 'ACCEPTED', bidderId: 'buyer', amount: 1, placedAt: auction.endTime }], page: 0, size: 10, totalPages: 1, totalElements: 1, first: true, last: true });
  await assert.rejects(service.bids(id), /không hợp lệ/);

 } finally { globalThis.fetch = original; await server.close(); }
});
test('auction layouts never inject mock sessions and seller fixture services are gone', async () => {
 for (const role of ['buyer', 'seller']) { const source = await readFile(new URL(`../src/roles/${role}/layouts/${role[0].toUpperCase() + role.slice(1)}Layout.tsx`, import.meta.url), 'utf8'); assert.doesNotMatch(source, /isAuctionMock|mock=/); assert.match(source, /<Header \/>/); }
 const header = await readFile(new URL('../src/shared/components/Header/Header.tsx', import.meta.url), 'utf8'); assert.doesNotMatch(header, /auctionHeaderMock|auctionHeaderCategories|if \(mock/);
 assert.deepEqual(await readdir(new URL('../src/features/seller-auction-result/services/', import.meta.url)), ['auctionResultService.ts']);
});
