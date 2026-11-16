import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('catalog routes preserve auth/404-only background and URL search', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: AppRoutes } = await server.ssrLoadModule('/src/app/routes/AppRoutes.tsx');
    const render = path => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(AppRoutes)));
    for (const path of ['/', '/products', '/categories', '/products/dimension-shifter']) {
      const html = render(path);
      assert.match(html, /nx-buyer-layout/);
      assert.doesNotMatch(html, /u363-shell|u363-bg|u089-page/);
      assert.match(html, /href="\/login"/);
      assert.match(html, /href="\/register"/);
      assert.doesNotMatch(html, />Alex</);
    }
    for (const path of ['/login', '/register', '/unknown-page']) {
      const html = render(path);
      assert.match(html, /u363-shell/);
      assert.doesNotMatch(html, /nx-buyer-layout/);
    }
    const searched = render('/products?q=Fenrir');
    assert.match(searched, /Kashtira Fenrir/);
    assert.doesNotMatch(searched, /Dimension Shifter|Ultimate Slayer/);
    const missing = render('/products?q=not-a-real-product');
    assert.doesNotMatch(missing, /Dimension Shifter|Kashtira Fenrir/);
  } finally { await server.close(); }
});
