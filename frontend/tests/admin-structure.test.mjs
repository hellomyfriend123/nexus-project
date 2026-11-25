import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('six admin pages mount named views and role routes are guarded without mock auth', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    for (const domain of ['Dashboard', 'Users', 'Catalog', 'Commerce', 'Fulfillment', 'Auctions']) {
      const { default: Page } = await server.ssrLoadModule('/src/features/admin/pages/Admin' + domain + 'Page.tsx');
      const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Page)));
      assert.match(html, /nx-page-header/);
      assert.match(html, /nx-admin-card|nx-stat-grid|nx-table-container|nx-card/);
      const page = readFileSync('src/features/admin/pages/Admin' + domain + 'Page.tsx', 'utf8');
      assert.match(page, /useAdmin/);
      assert.match(page, /View/);
      assert.doesNotMatch(page, /fetch\(|useState/);
    }
    const { default: routes } = await server.ssrLoadModule('/src/roles/administrator/routes.tsx');
    assert.equal(routes[0].path, '/admin');
    assert.equal(routes[0].children[0].children.length, 6);
    const guard = readFileSync('src/roles/administrator/layouts/AdminGuard.tsx', 'utf8');
    assert.doesNotMatch(guard, /loginAsMockAdmin|saveSession|adminAccount/);
  } finally { await server.close(); }
});

test('admin style selectors are scoped and no mock account is shipped', () => {
  const css = readFileSync('src/features/admin/styles/admin.css', 'utf8');
  for (const line of css.split('\n')) if (line.trimStart().startsWith('.')) assert.ok(line.startsWith('.nx-admin-layout'), line);
  assert.doesNotMatch(css, /:root/);
  const files = readdirSync('src/features/admin/services');
  assert.ok(files.includes('dashboard.mock.ts'));
  assert.ok(!files.some(name => /account/i.test(name)));
});
