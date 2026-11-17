import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
const product = { id: 'product-id', name: 'Máy ảnh thật', basePrice: 1200000, status: 'ACTIVE', sellerId: 'seller', categoryId: 'category', createdAt: '2026-01-01T00:00:00Z' };
test('catalog DTO adapters, paging, null omission and API contracts', async () => {
 const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' }); const oldFetch = globalThis.fetch;
 try {
  const catalog = await server.ssrLoadModule('/src/services/api/catalog.ts'); let last;
  globalThis.fetch = async (url, options) => { last = { url, options }; return Response.json({ content: [product], page: 0, size: 24, totalElements: 1, totalPages: 1 }); };
  const page = await catalog.listCatalogProducts({ keyword: 'máy & ảnh', categoryId: 'category', minPrice: 0, page: 0, size: 24, sort: 'basePrice,asc' });
  assert.equal(page.totalElements, 1); assert.equal(page.content[0].primaryImageUrl, null); assert.equal(page.content[0].categoryName, null);
  const url = new URL(last.url, 'http://localhost'); assert.equal(url.pathname, '/api/v1/catalog/products'); assert.equal(url.searchParams.get('keyword'), 'máy & ảnh'); assert.equal(url.searchParams.get('minPrice'), '0');
  globalThis.fetch = async (url, options) => { last = { url, options }; return Response.json({ ...product, images: [], updatedAt: product.createdAt }); };
  const detail = await catalog.getCatalogProduct('id/space here'); assert.equal(detail.description, null); assert.ok(last.url.endsWith('id%2Fspace%20here'));
  globalThis.fetch = async () => Response.json([{ id: 'category', name: 'Danh mục', status: 'ACTIVE', sortOrder: 0, children: [] }]);
  assert.equal((await catalog.getCatalogCategories())[0].parentId, null);
  for (const bad of [null, {}, { ...product, basePrice: '100' }, { ...product, status: 'WRONG' }]) assert.throws(() => catalog.adaptProduct(bad), /không hợp lệ/);
  globalThis.fetch = async (url, options) => { last = { url, options }; return Response.json(url.includes('/bids?') || url.includes('/reviews?') ? { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true } : { id: 'bid', auctionId: 'auction/id', bidderId: 'buyer', amount: 1500000, status: 'ACCEPTED', placedAt: '2026-01-01T00:00:00Z' }); };
  await catalog.placeBid('auction/id', 1500000); assert.ok(last.url.endsWith('/buyer/auction/auctions/auction%2Fid/bids')); assert.equal(last.options.method, 'POST'); assert.deepEqual(JSON.parse(last.options.body), { amount: 1500000 });
  await catalog.getBids('sale', 2); assert.ok(last.url.endsWith('/sale/bids?page=2&size=10'));
  await catalog.getReviews('product', 1); assert.ok(last.url.endsWith('/product/reviews?page=1&size=10'));
  globalThis.fetch = async () => Response.json({ message: 'Forbidden' }, { status: 403 }); await assert.rejects(catalog.getCatalogCategories(), /Forbidden/);
  globalThis.fetch = async () => { throw new TypeError('network'); }; await assert.rejects(catalog.listCatalogProducts({}), error => error.status === 0);
 } finally { globalThis.fetch = oldFetch; await server.close(); }
});
test('catalog cards and detail keep main UI structures with no fabricated data or demo commerce', async () => {
 const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
 try {
  const { default: Card } = await server.ssrLoadModule('/src/features/product/components/ProductCard.tsx');
  const { ProductDetail } = await server.ssrLoadModule('/src/features/product/pages/ProductDetailPage.tsx');
  const wrap = component => renderToStaticMarkup(createElement(MemoryRouter, null, component));
  const card = wrap(createElement(Card, { product })); assert.match(card, /product-id/); assert.match(card, /Thêm giỏ/); assert.doesNotMatch(card, /★★★★★|Miễn phí|Trả góp/);
  for (const slot of ['nx-save', 'u049-product-image', 'nx-old-price', 'nx-shipping']) assert.ok(card.includes(slot), slot);
  const html = wrap(createElement(ProductDetail, { product: { ...product, images: [], description: 'Mô tả thật', updatedAt: product.createdAt } }));
  for (const name of ['nx-detail-grid','nx-gallery','nx-thumbnails','nx-purchase','nx-seller','nx-detail-bottom','nx-specs','nx-reviews']) assert.ok(html.includes(name), name);
  assert.equal((html.match(/class="nx-rating-bar"/g) || []).length, 3);
  assert.match(html, /Thân vỏ: Chưa có dữ liệu <span>Vòng xoay: Chưa có dữ liệu/);
  assert.match(html, /Lá khẩu: Chưa có dữ liệu <span>Ngoại hình: Chưa có dữ liệu/);
  const auctionHtml = wrap(createElement(ProductDetail, { product: { ...product, images: [], updatedAt: product.createdAt }, initialAuction: { id: 'sale', productId: product.id, currentPrice: 1200000, startingPrice: 1000000, status: 'ACTIVE', startTime: '2026-01-01T00:00:00Z', endTime: '2099-01-01T00:00:00Z' } }));
  assert.ok(!auctionHtml.includes('u051-detail-cart')); assert.match(auctionHtml, /<small>giờ<\/small>/);
  assert.ok(html.includes('nx-purchase-button')); assert.ok(!html.includes('nx-detail-buy-actions'));
  assert.match(html, /Mô tả thật/); assert.doesNotMatch(html, /CameraHub|842|398241|4\.95|Top Rated|giỏ demo/);
 } finally { await server.close(); }
});

test('accepted bid is announced before refresh and refresh failure is not reported as rejection', async () => {
 const { readFile } = await import('node:fs/promises');
 const source = await readFile(new URL('../src/features/product/hooks/useProductDetail.ts', import.meta.url), 'utf8');
 const handler = source.slice(source.indexOf(' async function submitBid()'), source.indexOf(' async function share()'));
 assert.match(handler, /await placeBid\(auction.id, bid\)/);
 assert.ok(handler.indexOf("notify.success('Đặt giá thành công.')") < handler.indexOf('await getAuction(auction.id)'));
 assert.match(handler, /Giá thầu đã được ghi nhận nhưng tải lại phiên đấu giá thất bại/);
 assert.match(handler, /notify.warning\(message\)/);
 assert.match(handler, /bidLock.current = true/);
 assert.match(handler, /finally \{ bidLock.current = false; setPending\(false\); \}/);
});
