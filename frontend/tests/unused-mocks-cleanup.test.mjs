import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('obsolete demo data is removed while the live order hook and fixture facade are preserved', () => {
  for (const path of ['shared/demo/DemoNotice.tsx', 'features/seller-order-success/mocks/orderSuccess.mock.ts', 'features/buyer-hub/components/DemoOrders.tsx']) {
    assert.equal(existsSync(new URL('../src/' + path, import.meta.url)), false, path);
  }
  for (const path of ['roles/buyer/layouts/BuyerLayout.tsx','roles/seller/layouts/SellerLayout.tsx']) {
    assert.doesNotMatch(readFileSync(new URL('../src/' + path, import.meta.url), 'utf8'), /DemoNotice/);
  }
  // Removed legacy datasets are distinct from live API hooks and compatibility exports.
  for (const path of ['buyer-hub/mocks/buyerHub.mock.ts','cart/mocks/cart.mock.ts']) {
    assert.equal(existsSync(new URL('../src/features/' + path, import.meta.url)), false, path);
  }
  const hook = readFileSync(new URL('../src/features/seller-order-success/hooks/useOrderSuccess.ts', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../src/features/seller-order-success/pages/OrderSuccessPage.tsx', import.meta.url), 'utf8');
  assert.match(page, /import \{ useOrderSuccess \} from '..\/hooks\/useOrderSuccess'/);
  assert.match(hook, /services\/api\/seller/);
  for (const operation of ['order', 'cancelOrder', 'updateOrder']) assert.ok(hook.includes('sellerApi.' + operation + '('), operation);
  assert.doesNotMatch(hook, /orderSuccess\.mock|saveMock|demoStore/);
  for (const path of ['seller-listing/mocks/createListing.mock.ts', 'seller-hub/mocks/sellerHub.mock.ts', 'seller-inventory/mocks/inventory.mock.ts']) {
    const facade = readFileSync(new URL('../src/features/' + path, import.meta.url), 'utf8');
    assert.match(facade, /Compatibility exports/);
    // Only re-exports/comments: no replacement data or runtime persistence in these facades.
    for (const line of facade.split(/\r?\n/).map(line => line.trim()).filter(Boolean)) {
      assert.ok(line.startsWith('//') || /^export \{.+\} from '\.\.\/(services|constants)\/.+';$/.test(line), path + ': ' + line);
    }
  }
});

test('buyer and seller pages retain their shell without the backend notice', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Routes } = await server.ssrLoadModule('/src/app/routes/AppRoutes.tsx');
    for (const path of ['/', '/products', '/cart', '/buyer-hub', '/seller-hub', '/seller/products', '/seller/products/new', '/seller/orders/success']) {
      const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(Routes)));
      assert.doesNotMatch(html, /Backend connection notice|Các thao tác cần tài khoản và dịch vụ backend đang hoạt động|Dữ liệu máy chủ/, path);
      assert.equal((html.match(/<header class="nexus-header/g) || []).length, 1, path);
      assert.equal((html.match(/<footer class="nexus-footer/g) || []).length, 1, path);
    }
  } finally { await server.close(); }
});


