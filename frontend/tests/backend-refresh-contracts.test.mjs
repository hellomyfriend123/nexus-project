import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
const auction = { id: 'auction', productId: 'product', sellerId: 'seller', startingPrice: 100, currentPrice: 120, startTime: '2026-01-01T00:00:00Z', endTime: '2026-01-02T00:00:00Z', status: 'ENDED' };
const page = content => ({ content, page: 0, size: 10, totalElements: content.length, totalPages: content.length ? 1 : 0, first: true, last: true });
test('auction, bid and review GET adapters reject malformed wire data rather than rendering invalid financial values', async () => {
 const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
 const previous = globalThis.fetch;
 try {
  const api = await server.ssrLoadModule('/src/services/api/catalog.ts');
  assert.equal(api.adaptAuction(auction).highestBidderId, null);
  for (const patch of [{ currentPrice: '120' }, { status: 'SETTLED' }, { endTime: 'invalid' }, { acceptedBidCount: -1 }, { sellerId: null }]) assert.throws(() => api.adaptAuction({ ...auction, ...patch }), /không hợp lệ/);
  const bid = { id: 'bid', bidderId: 'buyer', amount: 120, status: 'ACCEPTED', placedAt: auction.endTime };
  assert.equal(api.adaptBid(bid).amount, 120);
  assert.throws(() => api.adaptBid({ ...bid, status: 'REJECTED' }));
  const review = { id: 'review', buyerId: 'buyer', score: 5, createdAt: auction.endTime };
  assert.equal(api.adaptReview(review).comment, null);
  for (const score of [0, 6, 1.5, '5']) assert.throws(() => api.adaptReview({ ...review, score }));
  for (const data of [{ content: [] }, { ...page([]), totalPages: -1 }, { ...page([]), last: 'true' }]) assert.throws(() => api.adaptApiPage(data, api.adaptAuction));
  globalThis.fetch = async url => Response.json(url.includes('/bids?') ? page([bid]) : url.includes('/reviews?') ? page([review]) : auction);
  assert.equal((await api.getAuction('auction')).currentPrice, 120);
  assert.equal((await api.getBids('auction')).content[0].id, 'bid');
  assert.equal((await api.getReviews('product')).content[0].score, 5);
  globalThis.fetch = async () => Response.json({ ...auction, currentPrice: null });
  await assert.rejects(api.getAuction('auction'), /không hợp lệ/);
 } finally { globalThis.fetch = previous; await server.close(); }
});
test('public header categories are loaded before the authentication gate', () => {
 const source = readFileSync(new URL('../src/shared/components/Header/Header.tsx', import.meta.url), 'utf8');
 assert.ok(source.indexOf('headerApi.categories(signal)') < source.indexOf('if (!current)'));
 assert.ok(source.indexOf('me(signal)') > source.indexOf('if (!current)'));
});
test('cart DELETE URL encodes the supplied line identifier', async () => {
 const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
 const previous = globalThis.fetch;
 try {
  const { commerceApi } = await server.ssrLoadModule('/src/services/api/commerce.ts'); let path;
  globalThis.fetch = async url => { path = url; return new Response(null, { status: 204 }); };
  await commerceApi.remove('line/one?x');
  assert.equal(path, '/api/v1/buyer/commerce/cart/items/line%2Fone%3Fx');
 } finally { globalThis.fetch = previous; await server.close(); }
});
