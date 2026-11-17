import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
const storage = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) }; };
test('result uses real contracts, all bid pages, server identity and unavailable payments', async () => {
 const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
 const originalFetch = globalThis.fetch;
 const oldLocal = Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const oldSession = Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 Object.defineProperty(globalThis,'localStorage',{value:storage(),configurable:true});
 Object.defineProperty(globalThis,'sessionStorage',{value:storage(),configurable:true});
 try {
  const auth = await server.ssrLoadModule('/src/features/auth/services/auth.api.ts');
  auth.saveSession({userId:'buyer',email:'test@example.test',fullName:'Test Buyer',roles:['BUYER'],accessToken:'test-not-real',tokenType:'Bearer',expiresAt:new Date(Date.now()+60000).toISOString()},false);
  const { getAuctionResult } = await server.ssrLoadModule('/src/features/auction-results/services/auctionResultService.ts');
  const { adaptSettlement } = await server.ssrLoadModule('/src/services/api/auction.ts');
  const id='00000000-0000-4000-8000-000000000001';
  let winner='buyer',status='WON',orderId=null; const calls=[];
  const date='2026-11-01T12:00:00Z';
  globalThis.fetch=async (url, options)=>{
   calls.push(String(url)); assert.equal(options.method ?? 'GET','GET');
   if(String(url).endsWith('/auth/me')) return Response.json({id:'buyer',email:'test@example.test',fullName:'Test Buyer',roles:['BUYER'],status:'ACTIVE'});
   if(String(url).endsWith('/settlement')) return Response.json({id:'settlement',auctionId:id,winnerId:winner,orderId,finalPrice:500,status,settledAt:date,bidCount:2});
   if(String(url).includes('/bids?')) {const second=String(url).includes('page=1');return Response.json({content:[{id:second?'b2':'b1',auctionId:id,bidderId:second?'buyer':'other',amount:second?400:500,status:'ACCEPTED',placedAt:date}],page:second?1:0,size:10,totalElements:2,totalPages:2,first:!second,last:second});}
   if(String(url).includes('/catalog/products/')) return Response.json({id:'product',name:'Real product',sellerId:'seller',basePrice:600,status:'ACTIVE',primaryImageUrl:null,images:[],categoryId:null,categoryName:null,description:null,createdAt:date,updatedAt:date});
   if(String(url).includes('/commerce/orders/')) return Response.json({id:'order',sellerId:'seller',createdAt:date,shippingAddress:'Test address',receiverName:'Buyer',receiverPhone:'000',orderNumber:'ORD1',orderType:'AUCTION',status:'PENDING',totalAmount:500,items:[]});
   return Response.json({id,productId:'product',sellerId:'seller',startingPrice:100,currentPrice:500,startTime:date,endTime:date,status:'ENDED',highestBidderId:winner,acceptedBidCount:2});
  };
  // Product status is the catalog enum, not auction status.
  const win=await getAuctionResult(id,'winner');
  assert.equal(win.summary.personalBid,400); assert.equal(win.bids.length,2);assert.equal(win.summary.deposit,null);assert.equal(win.product.image,'');assert.deepEqual(win.recommendations,[]);assert.equal(win.settlement.orderId,null);
  assert.ok(calls.some(x=>x.includes('page=1')));
  await assert.rejects(getAuctionResult('AUC-984','winner'),/UUID/);
  await assert.rejects(getAuctionResult(id,'loser'),/khớp/);
  winner='other';const loser=await getAuctionResult(id,'loser');assert.equal(loser.summary.personalBid,400);
  status='NO_BIDS'; await assert.rejects(getAuctionResult(id,'loser'),/kết quả/);status='WON';winner='buyer';orderId='order';
  assert.equal((await getAuctionResult(id,'winner')).settlement.orderStatus,'PENDING');
  assert.throws(()=>adaptSettlement({status:'WON'}));
  const {default:WinnerHero}=await server.ssrLoadModule('/src/features/auction-results/components/WinnerHero.tsx');
  const html=renderToStaticMarkup(createElement(WinnerHero,{summary:win.summary,settlement:win.settlement,seconds:0,onAction:()=>{}}));
  assert.match(html,/CHÚC MỪNG/);assert.match(html,/Thanh toán chưa khả dụng/);assert.match(html,/disabled/);assert.doesNotMatch(html,/23:59:51|45M|14%/);
 } finally {
  globalThis.fetch=originalFetch;
  if(oldLocal)Object.defineProperty(globalThis,'localStorage',oldLocal);else delete globalThis.localStorage;
  if(oldSession)Object.defineProperty(globalThis,'sessionStorage',oldSession);else delete globalThis.sessionStorage;
  await server.close();
 }
});
