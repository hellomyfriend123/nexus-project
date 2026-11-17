import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('404 offers implemented static destinations and ranks nearby paths first', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { recoveryRoutes, getRecoverySuggestions } = await server.ssrLoadModule('/src/shared/pages/notFoundSuggestions.ts');
    const paths = recoveryRoutes.map(route => route.path);
    assert.equal(new Set(paths).size, paths.length);
    for (const path of ['/', '/login', '/register', '/categories', '/products', '/cart', '/buyer-hub', '/seller-hub', '/seller/products', '/seller/products/new', '/seller/orders/success']) assert.ok(paths.includes(path));
    assert.ok(paths.every(path => !path.includes(':') && !path.includes('*')));
    assert.equal(getRecoverySuggestions('/seller/product')[0].path, '/seller/products');
    assert.equal(getRecoverySuggestions('/buyer-hu')[0].path, '/buyer-hub');
  } finally { await server.close(); }
});
