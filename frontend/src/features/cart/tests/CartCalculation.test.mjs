import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('CartCalculation preserves existing cart behavior', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { initialCartItems, vouchers } = await server.ssrLoadModule('/src/features/cart/tests/fixtures/cart.fixture.ts');
    const { calculateTotals } = await server.ssrLoadModule('/src/features/cart/services/cart.calculation.ts');
    const voucher = vouchers[0];
    const totals = calculateTotals(initialCartItems, { shippingFee: 0, voucher });
    assert.equal(totals.directSubtotal, 450000);
    assert.equal(totals.auctionSubtotal, 850000);
    assert.equal(totals.total, 1150000);
    assert.equal(calculateTotals(initialCartItems, { shippingFee: 45000, voucher }).total, 1195000);
    assert.equal(calculateTotals(initialCartItems.filter(item => item.mode === 'auction'), { shippingFee: 0, voucher }).discount, 0);
    assert.equal(calculateTotals([{ ...initialCartItems[0], unitPrice: 10000 }], { shippingFee: 0, voucher }).total, 0);
    assert.equal(calculateTotals([], { shippingFee: 45000, voucher }).total, 0);
  } finally {
    await server.close();
  }
});
