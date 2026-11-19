import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('buyer hub waits for actual orders and removes unsupported workspace tabs', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  let session = null;
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => session, removeItem() {} } });
  try {
    const { default: BuyerHubPage } = await server.ssrLoadModule('/src/features/buyer-hub/pages/BuyerHubPage.tsx');
    const render = path => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(BuyerHubPage)));
    const guest = render('/buyer-hub');
    assert.match(guest, /Đăng nhập để theo dõi/);
    assert.match(guest, /href="\/login"/);
    assert.doesNotMatch(guest, /buyer-order-status|Đang tải đơn hàng/);
    session = JSON.stringify({ userId: 'buyer', email: 'buyer@example.test', fullName: 'Buyer', roles: ['BUYER'], accessToken: 'test-token', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z' });
    for (const path of ['/buyer-hub', '/buyer-hub?tab=saved', '/buyer-hub?tab=c2c']) {
      const html = render(path);
      assert.match(html, /Đơn hàng của tôi/);
      assert.match(html, /Đang tải đơn hàng/);
      assert.match(html, /buyer-order-status/);
      assert.match(html, /Chờ xác nhận/);
      assert.match(html, /Đã xác nhận/);
      assert.doesNotMatch(html, /hub-tab-c2c|hub-panel-cart|Ví Nexus|Nexus Gold|Alex Nguyen|#AUC-|chưa được hỗ trợ|N\/A/);
      assert.doesNotMatch(html, /Chưa có đơn hàng/);
    }
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'sessionStorage', descriptor); else delete globalThis.sessionStorage;
    await server.close();
  }
});
