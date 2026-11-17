import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('seller tabs render auctions, orders, reports and honest unavailable states', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const fixtures = await server.ssrLoadModule('/src/features/seller-hub/mocks/sellerHub.mock.ts');
    const noop = () => {};
    const { default: AuctionsTab } = await server.ssrLoadModule('/src/features/seller-hub/components/AuctionsTab.tsx');
    const auctionHtml = rows => renderToStaticMarkup(createElement(AuctionsTab, { hub: { auctionFilter: 'all', setAuctionFilter: noop, visibleAuctions: rows, mockAction: noop } }));
    const auctions = auctionHtml(fixtures.sellerAuctions);
    assert.match(auctions, /id="hub-panel-auctions"/);
    for (const auction of fixtures.sellerAuctions) assert.ok(auctions.includes(auction.roomCode));
    assert.match(auctionHtml([]), /Không có phiên đấu giá nào ở trạng thái này/);
    const { default: OrdersTab } = await server.ssrLoadModule('/src/features/seller-hub/components/OrdersTab.tsx');
    const orderHtml = rows => renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(OrdersTab, { hub: { orderFilter: 'all', setOrderFilter: noop, visibleOrders: rows, pendingOrders: 3, mockAction: noop } })));
    const orders = orderHtml(fixtures.sellerOrders);
    assert.match(orders, /id="hub-panel-orders"/);
    for (const order of fixtures.sellerOrders) assert.ok(orders.includes(order.code));
    assert.match(orderHtml([]), /Không có đơn hàng ở trạng thái này/);
    const { default: ReportsTab } = await server.ssrLoadModule('/src/features/seller-hub/components/ReportsTab.tsx');
    const reports = renderToStaticMarkup(createElement(ReportsTab, { hub: { reportRange: '6m', setReportRange: noop, mockAction: noop } }));
    assert.match(reports, /Chưa có API/);
    assert.match(reports, /Điểm đánh giá shop/);
    assert.match(reports, /Điểm đánh giá shop/);
    assert.equal((reports.match(/class="nx-seller-chart-col"/g) || []).length, 6);
    assert.match(reports,/height:0%/);
    assert.match(reports,/Chưa có API báo cáo sản phẩm bán chạy/);
  } finally { await server.close(); }
});
