import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const readSource = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8');

test('runtime does not ship demo persistence or import legacy mock facades', () => {
 assert.equal(existsSync(new URL('../src/shared/demo/demoStore.ts', import.meta.url)), false);
 const visit = dir => { for (const entry of readdirSync(dir, { withFileTypes: true })) { if (entry.name === 'tests') continue; const path = join(dir, entry.name); if (entry.isDirectory()) visit(path); else if (/\.tsx?$/.test(path)) assert.doesNotMatch(readFileSync(path, 'utf8'), /from\s+['"][^'"]*(?:mocks\/|demoStore)/, path); } };
 for (const group of ['buyer-hub', 'cart', 'seller-hub', 'seller-inventory', 'seller-listing']) visit(fileURLToPath(new URL('../src/features/' + group, import.meta.url)));
});

test('live listing starts with empty commercial fields while preserved design fixtures remain separate', async () => {
 const { createServer } = await import('vite');
 let states = [], cursor = 0;
 globalThis.__listingDefaultsTest = {
  useState(initial) { const index = cursor++; if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial; return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }]; },
  useRef: value => ({ current: value }), useEffect() {}, useMemo: fn => fn(), useNavigate: () => () => {},
 };
 const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', plugins: [{
  name: 'listing-defaults-test', enforce: 'pre',
  transform(code, id) {
   if (!id.replaceAll('\\', '/').endsWith('/seller-listing/hooks/useCreateListing.ts')) return;
   return code.replace(/import \{([^}]+)\} from 'react';/, 'const {$1} = globalThis.__listingDefaultsTest;')
    .replace(/import \{ useNavigate \} from 'react-router-dom';/, 'const { useNavigate } = globalThis.__listingDefaultsTest;');
  },
 }] });
 try {
  const { useCreateListing: runListingHook } = await server.ssrLoadModule('/src/features/seller-listing/hooks/useCreateListing.ts');
  const constants = await server.ssrLoadModule('/src/features/seller-listing/constants/createListing.constants.ts');
  const fixtures = await server.ssrLoadModule('/src/features/seller-listing/services/listingDraft.mock.ts');
  const render = () => { cursor = 0; return runListingHook(); };
  let hook = render();
  for (const field of ['title', 'description', 'sku']) assert.equal(hook.draft[field], '', field);
  for (const field of ['price', 'dealPrice']) assert.equal(hook.draft[field], 0, field);
  assert.equal(hook.draft.quantity, 1);
  assert.equal(hook.category, ''); assert.deepEqual(hook.categories, []); assert.deepEqual(hook.media, []);
  assert.deepEqual(hook.saleModes, ['fixed']);
  for (const field of ['brand','shutter','warranty','origin','weight','length','width','height']) assert.equal(hook.draft[field], '', field);
  assert.deepEqual(hook.accessories, []);
  assert.equal(constants.listingSaleModes.find(mode => mode.id === 'auction').enabled, false);
  hook.toggleSaleMode('offer'); hook = render(); await hook.submitListing(); hook = render();
  assert.ok(hook.errors.some(message => message.includes('chỉ hỗ trợ mua ngay')), 'offer must not be silently persisted as supported');
  const source = readSource('features/seller-listing/hooks/useCreateListing.ts');
  const input = source.slice(source.indexOf('const input='), source.indexOf('assertProductRetryMatches(pendingProduct'));
  assert.match(input, /name:draft.title.trim\(\)/); assert.match(input, /description:draft.description.trim\(\)/);
  assert.match(input, /basePrice:draft.price/); assert.match(input, /categoryId:category/);
  assert.doesNotMatch(input, /accessories|shipping|condition|warranty|serviceFee|minOffer|listingWallet/);
  const cart = await server.ssrLoadModule('/src/features/cart/constants/cart.constants.ts');
  assert.deepEqual(cart.shippingMethods, []);
  assert.deepEqual(cart.paymentMethods.map(method => method.id), ['cod']);
 } finally { await server.close(); delete globalThis.__listingDefaultsTest; }
});

