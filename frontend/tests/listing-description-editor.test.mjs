import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('listing editor exposes four formatting tools without tables or attachments', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Editor } = await server.ssrLoadModule('/src/features/seller-listing/components/ListingDescriptionEditor.tsx');
    const html = renderToStaticMarkup(createElement(Editor, {
      id: 'listing-description', value: '', onChange: () => {}, placeholder: 'Nhập mô tả',
    }));
    assert.match(html, /contentEditable="true"/);
    assert.match(html, /role="textbox"/);
    assert.match(html, /aria-multiline="true"/);
    assert.match(html, /Định dạng trực tiếp/);
    assert.equal((html.match(/<button /g) ?? []).length, 4);
    assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 4);
    assert.doesNotMatch(html, /<textarea|type="file"|Hỗ trợ Markdown|bi-table|bi-paperclip|Chèn bảng|Đính kèm/);
  } finally {
    await server.close();
  }
});

test('placeholder tracks live text including composition input and deleting all content', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { updateEditorPlaceholder } = await server.ssrLoadModule('/src/features/seller-listing/utils/editorPlaceholder.ts');
    // Placeholder only depends on textContent/dataset, not on draft HTML or IME completion.
    const editor = { textContent: '', dataset: {} };
    updateEditorPlaceholder(editor);
    assert.equal(editor.dataset.empty, 'true');
    for (const text of ['a', 'Đ', 'Đang nhập tiếng Việt', 'Nội dung định dạng', 'Văn bản dán\nDòng 2']) {
      editor.textContent = text;
      updateEditorPlaceholder(editor);
      assert.equal(editor.dataset.empty, 'false', text);
    }
    for (const text of ['', '\n', '\u200b', '\u00a0']) {
      editor.textContent = text;
      updateEditorPlaceholder(editor);
      assert.equal(editor.dataset.empty, 'true', JSON.stringify(text));
    }
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(new URL('../src/features/seller-listing/components/ListingDescriptionEditor.tsx', import.meta.url), 'utf8');
    const syncValue = source.slice(source.indexOf('  function syncValue()'), source.indexOf('  function restoreSelection()'));
    assert.ok(syncValue.indexOf('updateEditorPlaceholder(editor)') < syncValue.indexOf('if (composing.current) return'));
    assert.match(source, /onCompositionEnd=\{\(\) => \{ composing.current = false; syncValue\(\); \}\}/);
  } finally { await server.close(); }
});
