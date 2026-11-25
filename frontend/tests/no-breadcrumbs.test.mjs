import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('breadcrumbs stay scoped to the existing seller auction header and styles', () => {
  const allowed = new Set(['features/seller-auction/components/AuctionHeader.tsx', 'features/seller-auction/styles/create-auction.css']);
  const found = new Set();
  const root = new URL('../src/', import.meta.url);
  function inspect(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
      if (entry.isDirectory()) inspect(path);
      else if (/\.(tsx?|jsx?|css)$/.test(entry.name)) {
        const source = readFileSync(path, 'utf8');
        if (/breadcrumb|breadscumb|nx-[\w-]*crumb/i.test(source)) {
          const relative = decodeURIComponent(path.pathname.slice(root.pathname.length));
          assert.ok(allowed.has(relative), 'Unexpected breadcrumb outside preserved auction UI: ' + relative);
          assert.doesNotMatch(source, /breadscumb|nx-[\w-]*crumb/i);
          found.add(relative);
        }
      }
    }
  }
  inspect(root);
  assert.deepEqual([...found].sort(), [...allowed].sort());
});

test('affected pages omit breadcrumbs while existing auction navigation and checkout steps are preserved', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: AppRoutes } = await server.ssrLoadModule('/src/app/routes/AppRoutes.tsx');
    const renderRoute = path => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(AppRoutes)));
    for (const path of ['/buyer-hub', '/cart', '/seller/products', '/seller/products/new', '/seller/orders/success']) {
      const html = renderRoute(path);
      assert.doesNotMatch(html, /breadcrumb|nx-[\w-]*crumb|aria-label="Đường dẫn"/i, path);
      assert.match(html, /nexus-header/); assert.match(html, /nexus-footer/);
    }
    const { default: AuctionHeader } = await server.ssrLoadModule('/src/features/seller-auction/components/AuctionHeader.tsx');
    const header = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(AuctionHeader)));
    assert.match(header, /class="sca-breadcrumb" aria-label="Đường dẫn"/);
    assert.match(header, /href="\/"/); assert.match(header, /href="\/seller-hub"/);
    assert.match(header, /Tạo Phiên Đấu Giá Mới/); assert.match(header, /sca-stepper/);
    const cart = renderRoute('/cart');
    assert.match(cart, /nx-cart-stepper/);
    assert.equal((cart.match(/class="nx-cart-step-item"/g) || []).length, 3);
    const inventory = renderRoute('/seller/products');
    assert.match(inventory, /Đồng bộ kho/); assert.match(inventory, /nx-stock-heading/);
    assert.match(renderRoute('/seller/orders/success'), /Điều hướng đơn hàng/);
  } finally { await server.close(); }
});
