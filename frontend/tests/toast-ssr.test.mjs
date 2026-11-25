import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

test('provider renders on the server without browser globals or sample notifications', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: ToastProvider } = await server.ssrLoadModule('/src/shared/components/Toast/ToastProvider.tsx');
    const html = renderToString(createElement(ToastProvider, null, createElement('main', null, 'App content')));
    assert.equal(html, '<main>App content</main>');
  } finally { await server.close(); }
});
