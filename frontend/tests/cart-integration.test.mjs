import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

test('cart shell waits for real data without rendering mock products or fake checkout', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: CartPage } = await server.ssrLoadModule('/src/features/cart/pages/CartPage.tsx');
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(CartPage)));
    assert.match(html, /nx-cart-page/);
    assert.match(html, /role="status"/);
    assert.match(html, /Đang tải giỏ hàng/);
    assert.match(html, /COD/);
    assert.doesNotMatch(html, /DEMO checkout|Alex Nguyen|Kashtira Fenrir|nx-cart-item-row|Giỏ hàng đang trống/);
    const { default: CartEmptyState } = await server.ssrLoadModule('/src/features/cart/components/CartEmptyState.tsx');
    const empty = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(CartEmptyState)));
    assert.match(empty, /href="\/products"/);
  } finally { await server.close(); }
});
