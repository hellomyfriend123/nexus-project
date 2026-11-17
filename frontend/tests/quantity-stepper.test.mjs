import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';

test('shared quantity stepper renders cart styling and respects quantity bounds', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: QuantityStepper } = await server.ssrLoadModule('/src/shared/components/QuantityStepper/QuantityStepper.tsx');
    let next;
    const render = (value, max) => QuantityStepper({ value, max, label: 'Sản phẩm', onChange: value => { next = value; } });
    const minimum = render(1, 3);
    const [decrease, , increase] = minimum.props.children;
    assert.equal(decrease.props.disabled, true);
    assert.equal(increase.props.disabled, false);
    decrease.props.onClick();
    assert.equal(next, 1);
    increase.props.onClick();
    assert.equal(next, 2);
    const input = minimum.props.children[1];
    for (const [typed, expected] of [[2, 2], [10, 3], [0, 1], [2.8, 2]]) {
      input.props.onChange({ currentTarget: { valueAsNumber: typed } });
      assert.equal(next, expected);
    }
    input.props.onChange({ currentTarget: { valueAsNumber: NaN } });
    assert.equal(next, 2);
    const empty = { value: '' };
    input.props.onBlur({ currentTarget: empty });
    assert.equal(empty.value, '1');
    const maximum = render(3, 3);
    assert.equal(maximum.props.children[2].props.disabled, true);
    maximum.props.children[2].props.onClick();
    assert.equal(next, 3);
    const unbounded = render(3);
    assert.equal(unbounded.props.children[2].props.disabled, false);
    unbounded.props.children[2].props.onClick();
    assert.equal(next, 4);
    const customMin = QuantityStepper({ value: 2, min: 2, max: 5, label: 'Sản phẩm', onChange: () => {} });
    assert.equal(customMin.props.children[0].props.disabled, true);
    const html = renderToStaticMarkup(minimum);
    assert.match(html, /nx-quantity-stepper/);
    assert.match(html, /role="group"/);
    assert.match(html, /type="number"/);
    assert.match(html, /inputMode="numeric"/);
    assert.match(html, /bi-dash/);
    assert.match(html, /bi-plus/);
    assert.doesNotMatch(html, /nx-cart-qty/);
  } finally { await server.close(); }
});
