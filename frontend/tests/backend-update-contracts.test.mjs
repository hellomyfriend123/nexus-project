import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('current backend nullable categories and UUID auction keyword are supported', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const original = globalThis.fetch;
  try {
    const catalog = await server.ssrLoadModule('/src/services/api/catalog.ts');
    const base = { id: 'c', name: 'Category', status: 'ACTIVE', children: [] };
    for (const sortOrder of [undefined, null, 0]) {
      const result = catalog.adaptCategory({ ...base, sortOrder, children: [{ ...base, id: 'nested', sortOrder: null }] });
      assert.equal(result.sortOrder, sortOrder ?? null);
      assert.equal(result.children[0].sortOrder, null);
    }
    for (const sortOrder of [-1, 1.5, '0']) assert.throws(() => catalog.adaptCategory({ ...base, sortOrder }));
    const product = { id: 'p', name: 'Product', basePrice: 10, status: 'ACTIVE', sellerId: 's', createdAt: '2026-01-01T00:00:00Z' };
    assert.equal(catalog.adaptProduct(product).categoryId, null);
    let calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true }); };
    await assert.rejects(catalog.listAuctions(new URLSearchParams({ keyword: 'camera' })), /UUID/);
    assert.equal(calls, 0);
    await catalog.listAuctions(new URLSearchParams({ keyword: '123e4567-e89b-12d3-a456-426614174000' }));
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; await server.close(); }
});

test('missing catalog enrichment does not hide valid inventory or header cart', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const original = globalThis.fetch;
  try {
    const seller = await server.ssrLoadModule('/src/features/seller-hub/services/seller.api.ts');
    const { headerApi } = await server.ssrLoadModule('/src/services/api/header.ts');
    const row = id => ({ id: 'i-' + id, skuId: 'sku-' + id, productId: id, skuCode: id, warehouseId: 'w', totalQuantity: 2, availableQuantity: 2, status: 'AVAILABLE' });
    const product = { id: 'live', sellerId: 's', name: 'Live product', categoryId: 'c', status: 'ACTIVE', basePrice: 100, images: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
    let missingStatus = 404;
    let lookups = [];
    globalThis.fetch = async url => {
      if (url.includes('/inventories?')) return Response.json({ content: [row('live'), row('deleted')], page: 0, size: 100, totalElements: 2, totalPages: 1, first: true, last: true });
      if (url.endsWith('/cart')) return Response.json({ id: 'cart', buyerId: 'buyer', status: 'ACTIVE', subtotal: 600, itemCount: 6, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', items: [{ id: 'a', productId: 'live', quantity: 2 }, { id: 'b', productId: 'deleted', quantity: 3 }, { id: 'c', productId: 'live', quantity: 1 }].map(item => ({ ...item, skuId: null, sellerId: 's', unitPrice: 100, lineTotal: item.quantity * 100 })) });
      lookups.push(url);
      if (url.endsWith('/deleted')) return Response.json({ message: 'Missing' }, { status: missingStatus });
      return Response.json(product);
    };
    assert.deepEqual(seller.productImagesForUpdate({ images: ['first.jpg', 'primary.jpg'], primaryImageUrl: 'primary.jpg' }), [
      { imageUrl: 'first.jpg', primary: false }, { imageUrl: 'primary.jpg', primary: true },
    ]);
    const inventory = await seller.loadSellerInventory();
    assert.deepEqual(inventory.inventories.map(i => i.productId), ['live']);
    lookups = [];
    const cart = await headerApi.cart();
    assert.equal(cart.items.length, 3);
    assert.equal(cart.items[0].productName, 'Live product');
    assert.equal(cart.items[1].productName, 'deleted');
    assert.equal(lookups.filter(url => url.endsWith('/live')).length, 1);
    missingStatus = 500;
    await assert.rejects(seller.loadSellerInventory(), e => e.status === 500);
    await assert.rejects(headerApi.cart(), e => e.status === 500);
    globalThis.fetch = async () => Response.json({ content: [] });
    await assert.rejects(seller.loadSellerAuctions('seller'), /không hợp lệ/);
  } finally { globalThis.fetch = original; await server.close(); }
});

test('buyer order actions follow all five backend statuses', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Row } = await server.ssrLoadModule('/src/features/buyer-hub/components/BuyerOrderCard.tsx');
    for (const status of ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED']) {
      const order = { id: 'order', status, orderNumber: 'ORD-001', orderType: 'DIRECT', totalAmount: 100, itemCount: 1, createdAt: '2026-01-01T00:00:00Z' };
      const html = renderToStaticMarkup(createElement(Row, { order, busy: false, reviewed: false, onDetail() {}, onCancel() {}, onReview() {}, onRebuy() {} }));
      assert.equal(html.includes('Hủy đơn'), ['PENDING', 'CONFIRMED', 'SHIPPING'].includes(status), status);
      assert.equal(html.includes('Đánh giá người bán'), status === 'COMPLETED', status);
      assert.match(html, /Xem chi tiết/);
    }
  } finally { await server.close(); }
});

test('checkout detects financial drift and validates backend address limits', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { hasCartFinancialDrift, validateCheckoutAddress } = await server.ssrLoadModule('/src/features/cart/services/cart.contract.ts');
    const line = { id: 'line', productId: 'p', sellerId: 's', skuId: null, quantity: 2, unitPrice: 100, lineTotal: 200 };
    const cart = { id: 'cart', items: [line], subtotal: 200 };
    assert.equal(hasCartFinancialDrift(cart, structuredClone(cart)), false);
    assert.equal(hasCartFinancialDrift(cart, { ...cart, subtotal: 220, items: [{ ...line, unitPrice: 110, lineTotal: 220 }] }), true);
    for (const change of [{ productId: 'other' }, { sellerId: 'other' }, { skuId: 'sku' }, { quantity: 3 }]) assert.equal(hasCartFinancialDrift(cart, { ...cart, items: [{ ...line, ...change }] }), true);
    const address = { receiverName: 'Nguyễn Minh', receiverPhone: '+84 901-234567', shippingAddress: 'Địa chỉ' };
    assert.equal(validateCheckoutAddress(address), null);
    for (const change of [{ receiverName: 'a'.repeat(151) }, { receiverPhone: 'abc' }, { shippingAddress: 'a'.repeat(501) }]) assert.ok(validateCheckoutAddress({ ...address, ...change }));
    const source = readFileSync(new URL('../src/features/cart/hooks/useCart.ts', import.meta.url), 'utf8');
    const handler = source.slice(source.indexOf('  const handleApplyVoucher'), source.indexOf('  const handleClearVoucher'));
    assert.match(source, /cart: scope\.bind\(commerceApi\.cart\)/);
    assert.ok(handler.indexOf('queue.settle()') >= 0);
    assert.ok(handler.indexOf('queue.settle()') < handler.indexOf('api.cart()'));
    assert.match(handler, /Number\(latest.subtotal\)/);
    assert.match(handler, /revision !== cartRevision.current/);
    assert.match(source, /notify.success\('Đã xóa sản phẩm khỏi giỏ hàng.'\); await refreshAfterMutation\(\)/);
    const header = readFileSync(new URL('../src/shared/components/Header/Header.tsx', import.meta.url), 'utf8');
    assert.match(header, /categories\/\$\{category.id\}/);
    assert.doesNotMatch(header, /key=\{cat.name\}|item.name === selectedCategory|cat\.icon/);
  } finally { await server.close(); }
});

