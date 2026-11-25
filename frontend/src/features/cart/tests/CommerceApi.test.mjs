import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('commerce adapters accept backend DTOs and reject unsafe monetary data', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { adaptCommerceCart, adaptCommerceOrder, adaptOrderSummary } = await server.ssrLoadModule('/src/services/api/commerce.ts');
    const line = { id: 'line', productId: 'product', skuId: null, sellerId: 'seller', quantity: 2, unitPrice: 12500, lineTotal: 25000 };
    const cart = { id: 'cart', buyerId: 'buyer', status: 'ACTIVE', subtotal: 25000, itemCount: 2, items: [line] };
    assert.deepEqual(adaptCommerceCart(cart).items, [line]);
    for (const invalid of [NaN, Infinity, -1, '25000', null]) assert.throws(() => adaptCommerceCart({ ...cart, subtotal: invalid }));
    assert.throws(() => adaptCommerceCart({ ...cart, items: [{ ...line, quantity: 0 }] }));
    assert.throws(() => adaptCommerceCart({ ...cart, items: [{ ...line, quantity: 1.5 }] }));
    assert.throws(() => adaptCommerceCart({ ...cart, items: null }));
    const summary = { id: 'order', orderNumber: 'NX-1', sellerId: 'seller', orderType: 'DIRECT', status: 'PENDING', totalAmount: 25000, itemCount: 1, createdAt: '2026-11-16T17:00:00Z' };
    assert.deepEqual(adaptOrderSummary(summary), summary);
    assert.throws(() => adaptOrderSummary({ ...summary, status: 'PAID' }));
    assert.throws(() => adaptOrderSummary({ ...summary, createdAt: 'invalid' }));
    const order = { ...summary, items: [{ ...line, productNameSnapshot: 'Camera' }], shippingAddress: 'Address', receiverName: 'Buyer', receiverPhone: '0900000000' };
    assert.equal(adaptCommerceOrder(order).items[0].productNameSnapshot, 'Camera');
    assert.throws(() => adaptCommerceOrder({ ...order, totalAmount: '25000' }));
    assert.throws(() => adaptCommerceOrder({ ...order, items: [{ ...line, productNameSnapshot: 123 }] }));
  } finally { await server.close(); }
});

test('checkout requires a nonempty single-seller cart', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { validateCheckoutCart } = await server.ssrLoadModule('/src/features/cart/services/cart.contract.ts');
    assert.ok(validateCheckoutCart({ items: [] }));
    assert.equal(validateCheckoutCart({ items: [{ sellerId: 'a' }, { sellerId: 'a' }] }), null);
    assert.ok(validateCheckoutCart({ items: [{ sellerId: 'a' }, { sellerId: 'b' }] }));
  } finally { await server.close(); }
});
