import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { readFileSync } from 'node:fs';

test('admin DTO transport and feature adapters use real contracts with mocked fetch only', async () => {
 const server = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
 const previousFetch=globalThis.fetch;
 const calls=[];
 let payload={}; let status=200;
 globalThis.fetch=async (url,options={})=>{calls.push({url,options});return new Response(status===204?null:JSON.stringify(payload),{status,headers:{'Content-Type':'application/json'}});};
 const page=row=>({content:[row],page:0,size:20,totalElements:37,totalPages:2,first:true,last:false});
 const expectCall=(url,method='GET',body)=>{const call=calls.at(-1);assert.equal(call.url,url);assert.equal(call.options.method??'GET',method);if(body!==undefined)assert.deepEqual(JSON.parse(call.options.body),body);};
 try {
  const api=await server.ssrLoadModule('/src/services/api/adminApi.ts');
  const feature=await server.ssrLoadModule('/src/features/admin/services/admin.service.ts');
  payload=page({id:'u',fullName:'Admin',roles:['ADMIN'],status:'ACTIVE'});
  await api.adminUsersApi.list({keyword:'a b',status:'ALL',role:'ADMIN',page:0,size:10});
  expectCall('/api/v1/admin/users?keyword=a+b&role=ADMIN&page=0&size=10');
  await api.adminUsersApi.updateStatus('u','BANNED'); expectCall('/api/v1/admin/users/u/status','PATCH',{status:'BANNED'});
  const product={id:'p',name:'Product',basePrice:120,status:'ACTIVE',sellerId:'seller-id',categoryId:'c',categoryName:'Category',primaryImageUrl:'/image.jpg',createdAt:'2026-01-01'};
  payload=page(product); const products=await feature.adminCatalogApi.listProducts({includeDeleted:false,categoryId:'c'});
  expectCall('/api/v1/admin/catalog/products?categoryId=c&includeDeleted=false'); assert.equal(products.content[0].price,120);assert.equal(products.content[0].sellerName,'seller-id');assert.equal(products.content[0].stockQuantity,undefined);assert.equal(products.totalElements,37);
  const category={name:'Category',description:'Description',parentId:null,sortOrder:3,status:'INACTIVE'};
  payload={id:'c',...category};await api.adminCatalogApi.updateCategory('c',category);expectCall('/api/v1/admin/catalog/categories/c','PUT',category);
  payload=page({id:'r',productId:'p',buyerId:'b',orderId:'o',score:4,comment:'Good',status:'VISIBLE',createdAt:'today'});
  const reviews=await feature.adminCatalogApi.listReviews({status:'VISIBLE'});expectCall('/api/v1/admin/catalog/reviews?status=VISIBLE');assert.equal(reviews.content[0].rating,4);assert.equal(reviews.content[0].userId,'b');assert.equal(reviews.content[0].status,'VISIBLE');
  await api.adminCatalogApi.updateReviewStatus('r','HIDDEN');expectCall('/api/v1/admin/catalog/reviews/r/status','PATCH',{status:'HIDDEN'});
  payload=page({id:'o',itemCount:2,buyerId:'buyer',status:'CONFIRMED',totalAmount:200});const orders=await feature.adminCommerceApi.listOrders({status:'CONFIRMED'});expectCall('/api/v1/admin/commerce/orders?status=CONFIRMED');assert.equal(orders.content[0].itemsCount,2);assert.equal(orders.content[0].paymentStatus,undefined);
  await feature.adminCommerceApi.listOrders({size:5,sort:'createdAt,desc'});expectCall('/api/v1/admin/commerce/orders?size=5&sort=createdAt%2Cdesc');
  await api.adminCommerceApi.updateOrderStatus('o','SHIPPING');expectCall('/api/v1/admin/commerce/orders/o/status','PATCH',{status:'SHIPPING'});
  await api.adminCommerceApi.cancelOrder('o');expectCall('/api/v1/admin/commerce/orders/o/cancel','POST');
  const campaign={name:'Sale',description:'Promo',startDate:'2026-01-01',endDate:'2026-02-01',status:'DRAFT'};payload={id:'campaign',...campaign};await api.adminCommerceApi.createCampaign(campaign);expectCall('/api/v1/admin/commerce/campaigns','POST',campaign);
  status=204;await api.adminCommerceApi.endCampaign('campaign');expectCall('/api/v1/admin/commerce/campaigns/campaign','DELETE');status=200;
  const coupon={campaignId:'campaign',code:'SAVE',discountType:'PERCENTAGE',discountValue:10,minOrderAmount:100,usageLimit:5,startAt:'2026-01-01T00:00:00Z',endAt:'2026-02-01T00:00:00Z',status:'ACTIVE'};payload={id:'coupon',...coupon,usedCount:2};const saved=await api.adminCommerceApi.createDiscountCode(coupon);expectCall('/api/v1/admin/commerce/discount-codes','POST',coupon);assert.equal(saved.usedCount,2);
  await api.adminCommerceApi.updateDiscountCodeStatus('coupon','INACTIVE');expectCall('/api/v1/admin/commerce/discount-codes/coupon/status','PATCH',{status:'INACTIVE'});
  payload=page({id:'i',skuId:'sku',productId:'p',skuCode:'SKU-1',skuName:'Variant',warehouseId:'w',totalQuantity:9,availableQuantity:4,status:'LOW_STOCK'});const inventory=await feature.adminFulfillmentApi.listInventories({warehouseId:'w',status:'LOW_STOCK'});expectCall('/api/v1/admin/fulfillment/inventories?warehouseId=w&status=LOW_STOCK');assert.equal(inventory.content[0].quantityReserved,5);assert.equal(inventory.content[0].quantityAvailable,4);assert.equal(inventory.content[0].status,'LOW_STOCK');
  const warehouse={name:'Warehouse',code:'WH',address:'Address'};payload={id:'w',...warehouse,status:'ACTIVE'};await api.adminFulfillmentApi.createWarehouse(warehouse);expectCall('/api/v1/admin/fulfillment/warehouses','POST',warehouse);
  payload=page({id:'a',productId:'p',sellerId:'s',currentPrice:100,startingPrice:10,status:'ACTIVE',highestBidderId:'b',bidCount:8,acceptedBidCount:2,bids:[{id:'bid',auctionId:'a',bidderId:'b',amount:100,status:'ACCEPTED',placedAt:'today'}]});const auctions=await feature.adminAuctionApi.list({status:'ACTIVE'});expectCall('/api/v1/admin/auction/auctions?status=ACTIVE');assert.equal(auctions.content[0].currentBid,100);assert.equal(auctions.content[0].totalBids,8);assert.equal(auctions.content[0].bids[0].bidTime,'today');
  await api.adminAuctionApi.cancel('a');expectCall('/api/v1/admin/auction/auctions/a/cancel','POST');
  status=403;payload={message:'Forbidden'};await assert.rejects(feature.adminAuctionApi.list(),error=>error.status===403&&error.message==='Forbidden');
  globalThis.fetch=async()=>{throw new Error('offline');};await assert.rejects(feature.adminCatalogApi.listReviews(),error=>error.status===0);
  const transport=readFileSync(new URL('../src/services/api/adminApi.ts',import.meta.url),'utf8');assert.doesNotMatch(transport,/features\/admin/);
  const dashboard=readFileSync(new URL('../src/features/admin/hooks/useAdminDashboard.ts',import.meta.url),'utf8');assert.doesNotMatch(dashboard,/listReviews|updateReviewStatus/);
 } finally {globalThis.fetch=previousFetch;await server.close();}
});
