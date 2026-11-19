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
      if (domain === 'Dashboard') {
        assert.match(html, /Người dùng/);
        assert.match(html, /Đơn hàng gần đây/);
        assert.match(html, /Đang tải dữ liệu/);
        assert.doesNotMatch(html, /MOCK|Tổng doanh thu|2[.,]458[.,]900[.,]000|14\.2%|8\.5%|5\.1%|Đánh giá chờ duyệt|so với tháng trước|sắp kết thúc hôm nay/);
      }
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

function splitSelectorList(selectorText) {
  const selectors = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < selectorText.length; index += 1) {
    const char = selectorText[index];
    if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;
    else if (char === ',' && depth === 0) {
      selectors.push(selectorText.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(selectorText.slice(start).trim());
  return selectors.filter(Boolean);
}

test('admin style selectors are scoped and no mock account or dashboard data is shipped', () => {
  const css = readFileSync('src/features/admin/styles/admin.css', 'utf8');
  for (const line of css.split('\n')) {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith('.')) continue;
    const selectorText = trimmed.split('{', 1)[0];
    for (const selector of splitSelectorList(selectorText)) {
      assert.ok(selector === '.nx-admin-layout' || selector.startsWith('.nx-admin-layout '), selector);
    }
  }
  assert.doesNotMatch(css, /:root/);
  const files = readdirSync('src/features/admin/services');
  assert.ok(!files.includes('dashboard.mock.ts'));
  assert.ok(!files.some(name => /account/i.test(name)));
});
