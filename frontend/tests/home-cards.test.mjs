import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('compact home cards preserve buy-now and auction actions, prices and missing images', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Card } = await server.ssrLoadModule('/src/features/home/components/HomeProductCard.tsx');
    const product = { id: 'item', name: 'Máy ảnh', basePrice: 1200000, status: 'ACTIVE', sellerId: 'seller', categoryName: null, primaryImageUrl: null };
    const render = value => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Card, { product: value })));
    const fixed = render(product);
    assert.match(fixed, /Chưa có ảnh/);
    assert.match(fixed, /Thêm giỏ/);
    assert.match(fixed, /1\.200\.000/);
    const auction = render({ ...product, auction: { id: 'sale/id', currentPrice: 2300000, endTime: '2026-12-01T12:00:00Z' } });
    assert.match(auction, /auctionId=sale%2Fid/);
    assert.match(auction, /Giá đấu hiện tại: 2\.300\.000/);
    assert.match(auction, /dateTime="2026-12-01T12:00:00Z"/);
    assert.match(auction, /Xem phiên đấu giá/);
    assert.doesNotMatch(auction, /Thêm giỏ|1\.200\.000/);
  } finally { await server.close(); }
});

test('carousel caps rendered cards and keeps empty, error and loading states accessible', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Pager } = await server.ssrLoadModule('/src/features/home/components/HomeProductPager.tsx');
    const render = props => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Pager, { products: [], label: 'Phiên đấu giá', ...props })));
    assert.doesNotMatch(render({}), /<button/);
    assert.match(render({ error: 'Không thể tải sản phẩm.' }), /role="alert"/);
    assert.match(render({ loading: true }), /aria-busy="true"/);
    const products = Array.from({ length: 15 }, (_, index) => ({ id: `item-${index}`, name: `Product ${index}`, basePrice: 100, status: 'ACTIVE', sellerId: 'seller' }));
    const html = render({ products });
    assert.match(html, /aria-roledescription="carousel"/);
    assert.equal((html.match(/<article/g) || []).length, 10);
    assert.doesNotMatch(html, /Product 10|trang 1|Trang sau/);
  } finally { await server.close(); }
});
