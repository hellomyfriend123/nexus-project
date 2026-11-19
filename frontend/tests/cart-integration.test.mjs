import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

test('guest cart asks for sign-in without rendering private products or fake checkout', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: CartPage } = await server.ssrLoadModule('/src/features/cart/pages/CartPage.tsx');
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(CartPage)));
    assert.match(html, /nx-cart-page/);
    assert.match(html, /Đăng nhập để xem giỏ hàng/);
    assert.match(html, /href="\/login"/);
    assert.match(html, /Giỏ hàng của bạn/);
    assert.doesNotMatch(html, /PCI-DSS|bảo hiểm hàng hóa|Lưu lại sau|Chat ngay/);
    assert.doesNotMatch(html, /DEMO checkout|Alex Nguyen|Kashtira Fenrir|nx-cart-item-row|Giỏ hàng đang trống/);
    const { default: CartEmptyState } = await server.ssrLoadModule('/src/features/cart/components/CartEmptyState.tsx');
    const empty = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(CartEmptyState)));
    assert.match(empty, /href="\/products"/);
  } finally { await server.close(); }
});
