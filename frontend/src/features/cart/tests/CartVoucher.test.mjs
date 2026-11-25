import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('CartVoucher preserves existing cart behavior', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { vouchers } = await server.ssrLoadModule('/src/features/cart/tests/fixtures/cart.fixture.ts');
    const { findVoucher } = await server.ssrLoadModule('/src/features/cart/services/cart.voucher.ts');
    assert.equal(findVoucher(' nexuswelcome ', vouchers).discount, 150000);
    assert.equal(findVoucher('INVALID', vouchers), undefined);
    assert.equal(findVoucher('', vouchers), undefined);
    assert.equal(findVoucher('NEXUSWELCOME', []), undefined);
  } finally {
    await server.close();
  }
});
