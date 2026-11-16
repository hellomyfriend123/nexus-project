import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Vite loads the existing TSX/CSS without adding a testing dependency.
test('ProductAssurance static config and supplied data', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  try {
    const { default: ProductAssurance } = await server.ssrLoadModule(
      '/src/features/product/components/ProductAssurance.tsx',
    );
    const { default: AssuranceItem } = await server.ssrLoadModule(
      '/src/features/product/components/AssuranceItem.tsx',
    );
    const { productAssuranceConfig } = await server.ssrLoadModule(
      '/src/features/product/services/productAssurance.config.ts',
    );
    const render = (component, props) =>
      renderToStaticMarkup(createElement(component, props));
    const defaults = render(ProductAssurance);
    assert.equal((defaults.match(/<section/g) || []).length, 3);
    assert.match(defaults, /Nexus Guarantee/);
    assert.match(defaults, /Thông tin mô phỏng/);
    assert.doesNotMatch(defaults, /100%|30 ngày|06 tháng/);
    assert.equal(render(ProductAssurance, { items: [] }), '');
    assert.equal(
      render(ProductAssurance, {
        items: productAssuranceConfig.map((item) => ({
          ...item,
          enabled: false,
        })),
      }),
      '',
    );
    const item = {
      id: 'custom',
      title: 'Custom policy',
      description: 'Supplied description',
      icon: 'shield',
      enabled: true,
    };
    const supplied = render(ProductAssurance, {
      items: [
        item,
        { ...item, id: 'hidden', title: 'Hidden policy', enabled: false },
      ],
    });
    assert.match(supplied, /Custom policy/);
    assert.match(supplied, /Supplied description/);
    assert.doesNotMatch(supplied, /Hidden policy|Nexus Guarantee/);
    assert.equal(
      render(AssuranceItem, { item: { ...item, enabled: false } }),
      '',
    );
    assert.match(
      render(AssuranceItem, { item: { ...item, title: '<unsafe>' } }),
      /&lt;unsafe&gt;/,
    );
    assert.match(supplied, /aria-labelledby=/);
    assert.match(supplied, /aria-hidden="true"/);
  } finally {
    await server.close();
  }
});
