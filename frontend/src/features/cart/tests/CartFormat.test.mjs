import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('CartFormat preserves existing cart behavior', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { formatVnd, formatCountdown } = await server.ssrLoadModule('/src/features/cart/utils/cart.format.ts');
    assert.equal(formatVnd(450000), '450.000 đ');
    assert.equal(formatCountdown(-1), '00:00:00');
    assert.equal(formatCountdown(3661), '01:01:01');
  } finally {
    await server.close();
  }
});
