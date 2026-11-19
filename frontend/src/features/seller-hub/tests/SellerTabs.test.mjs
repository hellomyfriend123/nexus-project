import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
test('seller tabs show real order and auction data with only supported actions', async () => {
  const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
  try {
    const fixtures=await server.ssrLoadModule('/src/features/seller-hub/mocks/sellerHub.mock.ts');
    const noop=()=>{};
    const render=element=>renderToStaticMarkup(createElement(MemoryRouter,{},element));
    const {default:AuctionsTab}=await server.ssrLoadModule('/src/features/seller-hub/components/AuctionsTab.tsx');
    const auctionHtml=rows=>render(createElement(AuctionsTab,{hub:{auctionFilter:'all',setAuctionFilter:noop,visibleAuctions:rows,auctionAction:noop,auctionLoading:false,auctionError:''}}));
    const auctions=auctionHtml(fixtures.sellerAuctions);
    assert.match(auctions,/id="hub-panel-auctions"/);
    for(const auction of fixtures.sellerAuctions)assert.ok(auctions.includes(auction.roomCode));
    assert.match(auctionHtml([]),/Không có phiên đấu giá nào ở trạng thái này/);
    assert.doesNotMatch(auctions,/N\/A|Quan tâm|thời gian thực|Bid tự động/);
    assert.match(auctions,/href="\/seller\/auctions\/new"/);
    const scheduled=auctionHtml([{...fixtures.sellerAuctions[0],backendStatus:'SCHEDULED',state:'SCHEDULED'}]);
    assert.match(scheduled,/Sửa phiên/);assert.match(scheduled,/Hủy phiên/);
    const ended=auctionHtml([{...fixtures.sellerAuctions[0],backendStatus:'ENDED',state:'ENDED'}]);
    assert.doesNotMatch(ended,/Sửa phiên|Hủy phiên/);assert.match(ended,/Xem chi tiết/);
    const {default:OrdersTab}=await server.ssrLoadModule('/src/features/seller-hub/components/OrdersTab.tsx');
    const orderHtml=rows=>render(createElement(OrdersTab,{hub:{orderFilter:'all',setOrderFilter:noop,setOrderPage:noop,visibleOrders:rows,pendingOrders:3,orderCounts:{},orderPage:1,orderPages:1}}));
    const orders=orderHtml(fixtures.sellerOrders);
    for(const order of fixtures.sellerOrders)assert.ok(orders.includes(order.code));
    assert.match(orderHtml([]),/Không có đơn hàng ở trạng thái này/);
    assert.doesNotMatch(orders,/In nhãn|Hạn xử lý|giao gấp/);
    const {default:Overview}=await server.ssrLoadModule('/src/features/seller-hub/components/SellerOverview.tsx');
    const overview=render(createElement(Overview,{activeTab:'products',onTabChange:noop}));
    assert.equal((overview.match(/role="tab"/g)||[]).length,3);
    assert.doesNotMatch(overview,/N\/A|Báo cáo|Đánh giá shop/);
  } finally { await server.close(); }
});
