import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

test('partial product creation rejects changed persisted fields but permits SKU-only retries', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { productCreationFingerprint, assertProductRetryMatches } = await server.ssrLoadModule('/src/features/seller-hub/hooks/productCreationRetry.ts');
    const input = { name: 'Product', description: '<p><strong>Rich HTML</strong></p>', basePrice: 200, categoryId: 'category', images: [] };
    const pending = { id: 'persisted-product', fingerprint: productCreationFingerprint(input) };
    assert.doesNotThrow(() => assertProductRetryMatches(null, input));
    assert.doesNotThrow(() => assertProductRetryMatches(pending, { ...input, skuCode: 'fixed-code', quantity: 5 }));
    for (const change of [{ name: 'Changed' }, { description: '<p>Changed</p>' }, { basePrice: 300 }, { categoryId: 'different' }, { images: [{ imageUrl: '/real.jpg', primary: true }] }]) {
      assert.throws(() => assertProductRetryMatches(pending, { ...input, ...change }), /khôi phục tên, mô tả, giá và danh mục/);
    }
    // Snapshot is independent of later draft mutations; restoring data permits retry.
    input.name = 'Changed';
    assert.throws(() => assertProductRetryMatches(pending, input));
    input.name = 'Product';
    assert.doesNotThrow(() => assertProductRetryMatches(pending, input));
    assert.ok(productCreationFingerprint(input).includes('<p><strong>Rich HTML</strong></p>'));
  } finally {
    await server.close();
  }
});

test('both mutation paths guard before writes and retain SKU retry state until success', async () => {
  for (const path of ['seller-hub/hooks/useSellerHub.ts', 'seller-listing/hooks/useCreateListing.ts']) {
    const source = await readFile(new URL('../src/features/' + path, import.meta.url), 'utf8');
    const submit = source.slice(source.indexOf('async function submitListing()'));
    assert.ok(submit.indexOf('assertProductRetryMatches(pendingProduct.current,input)') < submit.indexOf('sellerApi.createProduct(input)'));
    assert.ok(submit.includes('pendingProduct.current?.id'));
    assert.ok(submit.indexOf('pendingProduct.current={id,fingerprint:productCreationFingerprint(input)}') < submit.indexOf('await sellerApi.createSku'));
    assert.ok(submit.indexOf('pendingProduct.current=null') > submit.indexOf('await sellerApi.createSku'));
  }
});

test('hub clears completed draft before separately guarded inventory refresh', async () => {
  const source = await readFile(new URL('../src/features/seller-hub/hooks/useSellerHub.ts', import.meta.url), 'utf8');
  const submit = source.slice(source.indexOf('async function submitListing()'), source.indexOf('async function productAction'));
  assert.ok(submit.indexOf("setDraft({name:''") > submit.indexOf('await sellerApi.createSku'));
  assert.ok(submit.indexOf("setDraft({name:''") < submit.indexOf('try{const data=await loadSellerInventory()'));
  assert.ok(submit.includes("catch(e){notify.warning('Sản phẩm và SKU đã được tạo thành công, nhưng chưa tải lại được kho"));
});
