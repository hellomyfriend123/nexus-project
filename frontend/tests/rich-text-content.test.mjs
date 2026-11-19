import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const read = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8');

test('editor and detail use the same scoped formatting and sanitizer', () => {
  const editor = read('features/seller-listing/components/ListingDescriptionEditor.tsx');
  const content = read('shared/components/RichText/RichTextContent.tsx');
  const detail = read('features/product/pages/ProductDetailPage.tsx');
  const purchase = read('features/product/components/ProductPurchase.tsx');
  const css = read('shared/styles/rich-text.css');
  assert.match(editor, /shared\/utils\/richTextHtml/);
  assert.match(editor, /nx-listing-editor-content nx-rich-text/);
  for (const source of [editor, content]) assert.match(source, /styles\/rich-text\.css/);
  assert.match(content, /serializeRichTextHtml\(value\)/);
  assert.match(content, /dangerouslySetInnerHTML=\{\{ __html: safeHtml \}\}/);
  assert.equal((detail.match(/<RichTextContent /g) || []).length, 1);
  assert.equal((purchase.match(/<RichTextContent /g) || []).length, 0);
  assert.match(detail, /<RichTextContent[^>]*value=\{product.description\}/);
  assert.doesNotMatch(detail, /<p[^>]*>\{product\.description/);
  assert.match(css, /\.nx-rich-text ul \{ list-style-type: disc/);
  assert.match(css, /\.nx-rich-text ol \{ list-style-type: decimal/);
  assert.match(css, /font-weight: 700/);
  assert.match(css, /font-style: italic/);
  assert.match(css, /white-space: pre-wrap/);
  assert.doesNotMatch(read('features/seller-listing/styles/create-listing.css'), /\.nx-listing-editor-content (?:ul|ol|strong|b|i|em|p)[ ,{]/);
});

test('description renders empty/plain text safely without a browser DOM and preserves detail slots', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Content } = await server.ssrLoadModule('/src/shared/components/RichText/RichTextContent.tsx');
    const render = value => renderToStaticMarkup(createElement(Content, { value, fallback: 'Chưa có mô tả.' }));
    for (const value of [null, undefined, '', '  ']) assert.match(render(value), /Chưa có mô tả\./);
    assert.match(render('Dòng một\nDòng hai'), /Dòng một\nDòng hai/);
    const untrusted = render('<script>alert(1)</script><img src=x onerror=alert(1)><b>Máy ảnh</b>');
    assert.doesNotMatch(untrusted, /<script|<img|<b>/);
    assert.match(untrusted, /&lt;script&gt;/);
    const { ProductDetail } = await server.ssrLoadModule('/src/features/product/pages/ProductDetailPage.tsx');
    const product = { id: 'p1', name: 'Máy ảnh', description: '<strong>Máy tốt</strong>', basePrice: 100, status: 'ACTIVE', sellerId: 'seller', categoryId: 'c1', categoryName: 'Máy ảnh', images: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
    const detail = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ProductDetail, { product })));
    assert.doesNotMatch(detail, /class="nx-rich-text nx-rich-text-display nx-muted"/);
    assert.match(detail, /class="nx-rich-text nx-rich-text-display nx-description-content"/);
    for (const section of ['nx-detail-grid', 'nx-detail-bottom', 'nx-description', 'nx-purchase']) assert.ok(detail.includes(section));
  } finally { await server.close(); }
});
