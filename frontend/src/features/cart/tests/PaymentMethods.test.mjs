import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('PaymentMethods preserves existing cart behavior', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { paymentMethods } = await server.ssrLoadModule('/src/features/cart/tests/fixtures/cart.fixture.ts');
    const { default: PaymentMethods } = await server.ssrLoadModule('/src/features/cart/components/PaymentMethods.tsx');
    const paymentHtml = hasAuctionItems => renderToStaticMarkup(createElement(PaymentMethods, {
      methods: paymentMethods, value: 'vnpay', onChange: () => {}, hasAuctionItems,
    }));
    assert.match(paymentHtml(true), /<input[^>]*disabled=""[^>]*value="cod"/);
    assert.doesNotMatch(paymentHtml(false), /disabled=""/);
  } finally {
    await server.close();
  }
});
