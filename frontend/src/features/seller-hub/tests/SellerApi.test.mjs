import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
test('seller API uses actual paths, IDs, DTOs, pagination, auth and empty delete responses', async () => {
    const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
    const oldFetch = globalThis.fetch;
    const descriptors = ['localStorage', 'sessionStorage'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]);
    const values = new Map(); const storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) };
    for (const [key] of descriptors) Object.defineProperty(globalThis, key, { value: storage, configurable: true });
    try {
        const auth = await server.ssrLoadModule('/src/features/auth/services/auth.api.ts');
        auth.saveSession({ userId: 'seller', email: 'seller@example.test', fullName: 'Test Seller', roles: ['SELLER'], accessToken: 'fake-test-token', tokenType: 'Bearer', expiresAt: new Date(Date.now() + 60000).toISOString() }, false);
        const { sellerApi: api, nextOrderStatus } = await server.ssrLoadModule('/src/features/seller-hub/services/seller.api.ts');
        let calls = []; globalThis.fetch = async (url, options) => {
            calls.push({ url, options });
            const product = { id: 'actual-id', sellerId: 'seller', name: 'Camera', description: null, basePrice: 100, categoryId: 'cat', categoryName: 'Category', status: 'ACTIVE', images: [] };
            const inventory = { id: 'inventory-id', skuId: 'sku-id', productId: 'product-id', skuCode: 'CODE', skuName: null, warehouseId: 'warehouse-id', totalQuantity: 0, availableQuantity: 0, status: 'OUT_OF_STOCK' };
            const sku = { id: 'sku-id', productId: 'product-id', sellerId: 'seller', skuCode: 'CODE', name: null, price: null };
            const order = { id: 'order-id', orderNumber: 'REAL-ORDER', status: 'PENDING', totalAmount: 100, createdAt: new Date().toISOString(), items: [{ id:'item-id',productId:'product-id',productNameSnapshot:'Camera',quantity:1,unitPrice:100,subtotal:100 }] };
            let body = url.includes('/inventories') ? inventory : url.includes('/skus') ? sku : url.includes('/orders') ? order : product;
            if (url.includes('?')) body = { content: [body], page: 0, size: 10, totalElements: 1, totalPages: 1, first: true, last: true };
            return options.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json(body);
        };
        const check = (suffix, method, body) => { const last = calls.at(-1); assert.ok(last.url.endsWith('/api/v1' + suffix), last.url); assert.equal(last.options.method, method); assert.equal(new Headers(last.options.headers).get('Authorization'), 'Bearer fake-test-token'); if (body !== undefined) assert.deepEqual(JSON.parse(last.options.body), body); };
        const product = { name: 'Camera', description: 'Working', basePrice: 100, categoryId: 'category-id', images: [{ imageUrl: 'https://example.test/image.jpg', primary: true }] };
        await api.createProduct(product); check('/seller/catalog/products', 'POST', product);
        const { categoryId, ...update } = product; await api.updateProduct('product-id', update); check('/seller/catalog/products/product-id', 'PUT', update);
        await api.assignCategory('product-id', categoryId); check('/seller/catalog/products/product-id/category', 'PATCH', { categoryId });
        assert.equal(await api.deleteProduct('product-id'), undefined); check('/seller/catalog/products/product-id', 'DELETE');
        const query = new URLSearchParams({ page: '2', size: '10', productId: 'product-id', skuId: 'sku-id', warehouseId: 'warehouse-id', status: 'LOW_STOCK', keyword: 'ABC' });
        await api.inventories(query); check('/seller/fulfillment/inventories?' + query, 'GET');
        await api.updateInventory('inventory-id', 'SET_AVAILABLE', 0); check('/seller/fulfillment/inventories/inventory-id', 'PATCH', { operation: 'SET_AVAILABLE', quantity: 0 });
        await api.skus(3); check('/seller/fulfillment/skus?page=3&size=10', 'GET');
        const sku = { productId: 'existing-product', initialTotalQuantity: 10, initialAvailableQuantity: 7 }; await api.createSku(sku); check('/seller/fulfillment/skus', 'POST', sku);
        assert.equal(calls.filter(c => c.url.endsWith('/seller/catalog/products') && c.options.method === 'POST').length, 1, 'creating SKU never recreates product');
        await api.orders(1, 'PENDING'); check('/seller/commerce/orders?page=1&size=10&status=PENDING', 'GET');
        await api.order('order-id'); check('/seller/commerce/orders/order-id', 'GET');
        await api.updateOrder('order-id', 'CONFIRMED'); check('/seller/commerce/orders/order-id/status', 'PATCH', { status: 'CONFIRMED' });
        await api.cancelOrder('order-id'); check('/seller/commerce/orders/order-id/cancel', 'POST');
        assert.equal(nextOrderStatus.PENDING, 'CONFIRMED'); assert.equal(nextOrderStatus.CONFIRMED, 'SHIPPING'); assert.equal(nextOrderStatus.SHIPPING, 'COMPLETED'); assert.equal(nextOrderStatus.COMPLETED, undefined);
        for (const bad of [null, {}, [], { content: null }, { content: [{}], page: 0, size: 10, totalElements: 1, totalPages: 1, first: true, last: true }]) { globalThis.fetch = async () => Response.json(bad); await assert.rejects(api.inventories(new URLSearchParams({ page: '0' }))); }
        globalThis.fetch = async () => Response.json({ id: 'not-a-product' }); await assert.rejects(api.product('known-id'), /không hợp lệ/);
        for (const status of [403, 404, 409, 422, 500]) { globalThis.fetch = async () => Response.json({ message: 'Rejected by server' }, { status }); await assert.rejects(api.updateInventory('inventory-id', 'DECREASE', 99), e => e.status === status); }
        globalThis.fetch = async () => { throw new Error('offline'); }; await assert.rejects(api.createSku(sku), e => e.status === 0);
        globalThis.fetch = async (_url, options) => { if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError'); return Response.json({}); }; const abort = new AbortController(); abort.abort(); await assert.rejects(api.orders(0, '', abort.signal), e => e.name === 'AbortError');
    } finally { globalThis.fetch = oldFetch; for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } await server.close(); }
});

test('seller auction ownership paging and real shipment mutations',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});const old=globalThis.fetch;
 try{const svc=await server.ssrLoadModule('/src/features/seller-hub/services/seller.api.ts');const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});if(url.includes('/auction/auctions?'))return Response.json({content:[{id:'own',sellerId:'seller',productId:'p'},{id:'other',sellerId:'other',productId:'q'}],last:true,totalPages:1});return Response.json({id:'own',sellerId:'seller',productId:'p',status:'SCHEDULED',acceptedBidCount:2});};
 const rows=await svc.loadSellerAuctions('seller');assert.equal(rows.length,1);assert.equal(rows[0].id,'own');assert.ok(!calls.some(c=>c.url.endsWith('/other')));
 await svc.mutateAuction(null,{productId:'p',startingPrice:100});assert.equal(calls.at(-1).options.method,'POST');assert.ok(calls.at(-1).url.endsWith('/seller/auction/auctions'));
 await svc.mutateAuction('own',{startingPrice:120});assert.equal(calls.at(-1).options.method,'PUT');
 await svc.cancelAuction('own');assert.ok(calls.at(-1).url.endsWith('/seller/auction/auctions/own/cancel'));
 await svc.createShipment('order','REAL-AWB');assert.deepEqual(JSON.parse(calls.at(-1).options.body),{orderId:'order',trackingNumber:'REAL-AWB'});assert.ok(calls.at(-1).url.endsWith('/seller/fulfillment/shipments'));
 await svc.updateShipment('shipment','SHIPPED');assert.equal(calls.at(-1).options.method,'PATCH');assert.deepEqual(JSON.parse(calls.at(-1).options.body),{status:'SHIPPED'});
 }finally{globalThis.fetch=old;await server.close();}
});
