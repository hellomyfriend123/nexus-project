import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('404 offers implemented static destinations and ranks nearby paths first', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { recoveryRoutes, getRecoverySuggestions } = await server.ssrLoadModule('/src/shared/pages/notFoundSuggestions.ts');
    const paths = recoveryRoutes.map(route => route.path);
    assert.equal(new Set(paths).size, paths.length);
    for (const path of ['/', '/login', '/register', '/categories', '/products', '/cart', '/buyer-hub', '/seller-hub', '/seller/products', '/seller/products/new', '/seller/orders/success', '/seller/auctions/new', '/admin', '/admin/users', '/admin/catalog', '/admin/commerce', '/admin/fulfillment', '/admin/auctions']) assert.ok(paths.includes(path));
    assert.ok(paths.every(path => !path.includes(':') && !path.includes('*')));
    assert.equal(getRecoverySuggestions('/seller/product')[0].path, '/seller/products');
    assert.equal(getRecoverySuggestions('/buyer-hu')[0].path, '/buyer-hub');
    assert.equal(getRecoverySuggestions('/seller/auction/new')[0].path, '/seller/auctions/new');
    assert.equal(getRecoverySuggestions('/admin/aution')[0].path, '/admin/auctions');
    assert.ok(recoveryRoutes.filter(route => route.path.startsWith('/admin')).every(route => route.label.includes('cần quyền Admin')));
    assert.ok(paths.every(path => !path.includes('callback') && !path.includes('?')));
    const { matchRoutes } = await import('react-router-dom');
    const { default: buyer } = await server.ssrLoadModule('/src/roles/buyer/routes.tsx');
    const { default: seller } = await server.ssrLoadModule('/src/roles/seller/routes.tsx');
    const { default: admin } = await server.ssrLoadModule('/src/roles/administrator/routes.tsx');
    const implemented = [...buyer, ...seller, ...admin, { path: '/login' }, { path: '/register' }];
    for (const path of paths) assert.ok(matchRoutes(implemented, path), path + ' must resolve to an implemented route');
  } finally { await server.close(); }
});
