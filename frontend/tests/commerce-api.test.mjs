import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
const storage = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; };
test('commerce services use exact authenticated Java controller contracts and propagate errors', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const previous = globalThis.fetch;
  const descriptors = ['localStorage', 'sessionStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  for (const [key] of descriptors) Object.defineProperty(globalThis, key, { configurable: true, value: storage() });
  try {
    const auth = await server.ssrLoadModule('/src/features/auth/services/auth.api.ts');
    const { commerceApi } = await server.ssrLoadModule('/src/services/api/commerce.ts');
    const { buyerApi } = await server.ssrLoadModule('/src/services/api/buyer.ts');
    auth.saveSession({ userId: 'buyer', email: 'buyer@example.test', fullName: 'Buyer', roles: ['BUYER'], accessToken: 'test-only', tokenType: 'Bearer', expiresAt: new Date(Date.now() + 60000).toISOString() }, false);
    const calls = [];
    const timestamp = '2026-01-01T00:00:00Z';
    const cart = { id: 'cart', subtotal: 20000, itemCount: 2, items: [{ id: 'item', productId: 'product', skuId: null, sellerId: 'seller', quantity: 2, unitPrice: 10000, lineTotal: 20000 }] };
    const summary = { id: 'order', orderNumber: 'ORD-001', sellerId: 'seller', orderType: 'DIRECT', status: 'PENDING', totalAmount: 20000, itemCount: 1, createdAt: timestamp };
    const order = { ...summary, items: [{ id: 'order-item', productId: 'product', skuId: null, sellerId: 'seller', productNameSnapshot: 'Actual name', quantity: 2, unitPrice: 10000 }], shippingAddress: 'Actual address', receiverName: 'Actual buyer', receiverPhone: '+84901234567' };
    const product = { id: 'product', sellerId: 'seller', name: 'Actual name', basePrice: 10000, categoryId: null, categoryName: null, status: 'ACTIVE', primaryImageUrl: null, createdAt: timestamp, description: null, images: [], updatedAt: timestamp };
    const profile = { id: 'buyer', email: 'buyer@example.test', username: 'buyer', fullName: 'Buyer', phone: null, address: null, createdAt: timestamp };
    const rating = { id: 'rating', orderId: 'order', sellerId: 'seller', buyerId: 'buyer', score: 5, comment: null, status: 'ACTIVE', createdAt: timestamp };
    const shipments = [{ trackingNumber: 'TRACK-001', status: 'SHIPPING' }];
    const responses = [
      [{ ...cart, buyerId: 'buyer', status: 'ACTIVE', createdAt: timestamp, updatedAt: timestamp }, cart],
      [{ ...cart, buyerId: 'buyer', status: 'ACTIVE', createdAt: timestamp, updatedAt: timestamp }, cart],
      [{ ...cart, subtotal: 30000, itemCount: 3, items: [{ ...cart.items[0], quantity: 3, lineTotal: 30000 }], buyerId: 'buyer', status: 'ACTIVE', createdAt: timestamp, updatedAt: timestamp }, { ...cart, subtotal: 30000, itemCount: 3, items: [{ ...cart.items[0], quantity: 3, lineTotal: 30000 }] }],
      [{ code: 'CODE', discountType: 'FIXED', orderAmount: 30000, discountAmount: 1000, finalAmount: 29000 }, { code: 'CODE', discountAmount: 1000 }],
      ...['PENDING', 'PENDING', 'CANCELLED'].map(status => {
        const expected = { ...order, status };
        return [{ ...expected, buyerId: 'buyer', subtotal: 20000, discount: 0, shippingFee: 0, discountCode: null, updatedAt: timestamp, items: expected.items.map(item => ({ ...item, skuCodeSnapshot: null, subtotal: 20000 })) }, expected];
      }),
    ];
    // Orders paging occurs between checkout and detail requests.
    responses.splice(5, 0, [{ content: [summary], page: 2, size: 100, totalElements: 201, totalPages: 3, first: false, last: true }, { content: [summary], totalElements: 201, totalPages: 3 }]);
    responses.push([rating, rating], [profile, profile], [product, product], [shipments, shipments]);
    let responseIndex = 0;
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json(responses[responseIndex][0]); };
    const expect = async (operation, path, method = 'GET', body) => {
      assert.deepEqual(await operation(), responses[responseIndex++][1]);
      const last = calls.at(-1);
      assert.equal(last.url, path);
      assert.equal(last.options.method ?? 'GET', method);
      assert.equal(last.options.headers.get('Authorization'), 'Bearer test-only');
      assert.equal(last.options.headers.get('Accept'), 'application/json');
      if (body !== undefined) {
        assert.deepEqual(JSON.parse(last.options.body), body);
        assert.equal(last.options.headers.get('Content-Type'), 'application/json');
      } else assert.equal(last.options.body, undefined);
    };
    const base = '/api/v1/buyer/commerce';
    await expect(() => commerceApi.cart(), `${base}/cart`);
    const line = { productId: 'product', sellerId: 'seller', productName: 'Actual name', quantity: 2, unitPrice: 10000 };
    await expect(() => commerceApi.add(line), `${base}/cart/items`, 'POST', line);
    await expect(() => commerceApi.quantity('item', 3), `${base}/cart/items/item`, 'PUT', { quantity: 3 });
    await expect(() => commerceApi.discount('CODE', 30000), `${base}/checkout/apply-discount`, 'POST', { code: 'CODE', orderAmount: 30000, orderType: 'DIRECT' });
    const input = { receiverName: 'Actual buyer', receiverPhone: '+84901234567', shippingAddress: 'Actual address', paymentMethod: 'COD', discountCode: 'CODE' };
    await expect(() => commerceApi.checkout(input), `${base}/checkout`, 'POST', input);
    await expect(() => commerceApi.orders(2), `${base}/orders?page=2&size=100&sort=createdAt,desc`);
    await expect(() => commerceApi.order('order'), `${base}/orders/order`);
    await expect(() => commerceApi.cancel('order'), `${base}/orders/order/cancel`, 'POST');
    await expect(() => commerceApi.rateSeller('order', 'seller', 5), `${base}/seller-ratings`, 'POST', { orderId: 'order', sellerId: 'seller', score: 5 });
    await expect(() => buyerApi.profile(), '/api/v1/buyer/profile');
    await expect(() => buyerApi.product('product'), '/api/v1/catalog/products/product');
    await expect(() => buyerApi.shipments('order id'), '/api/v1/buyer/fulfillment/shipments?orderId=order%20id');
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return new Response(null, { status: 204 }); };
    assert.equal(await commerceApi.remove('item'), null);
    assert.equal(calls.at(-1).url, `${base}/cart/items/item`);
    assert.equal(calls.at(-1).options.method, 'DELETE');
    assert.ok(calls.every(call => !/payments|watchlist|my-bids/.test(call.url)));
    for (const status of [401, 403, 409, 422]) {
      globalThis.fetch = async () => Response.json({ message: `Backend ${status}`, details: [{ field: 'quantity' }] }, { status });
      await assert.rejects(commerceApi.checkout(input), error => error.status === status && error.message === `Backend ${status}` && error.details[0].field === 'quantity');
    }
    globalThis.fetch = async () => { throw new TypeError('offline'); };
    await assert.rejects(commerceApi.cart(), error => error.status === 0);
    globalThis.fetch = async () => new Response('not JSON');
    await assert.rejects(commerceApi.cart(), /Phản hồi máy chủ/);
  } finally {
    globalThis.fetch = previous;
    for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
    await server.close();
  }
});
