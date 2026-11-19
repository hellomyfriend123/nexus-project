import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('listing price UI and payload use one supported selling price', async () => {
 const server = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
 try {
  const {default: Pricing} = await server.ssrLoadModule('/src/features/seller-listing/components/ListingPricing.tsx');
  const html = renderToStaticMarkup(createElement(Pricing, {hub:{draft:{price:123.45,quantity:1},updateDraft(){},changeQuantity(){}}}));
  assert.match(html, /id="listing-price"/);
  assert.match(html, /step="0.01"/);
  assert.match(html, /value="123.45"/);
  assert.doesNotMatch(html, /listing-deal|listing-min-offer|type="checkbox"|% OFF/);
  const source = readFileSync(new URL('../src/features/seller-listing/hooks/useCreateListing.ts', import.meta.url),'utf8');
  assert.match(source, /basePrice:draft.price/);
  assert.match(source, /price:input.basePrice/);
  assert.doesNotMatch(source, /basePrice:draft.dealPrice/);
  const page = readFileSync(new URL('../src/features/seller-listing/pages/CreateListingPage.tsx', import.meta.url),'utf8');
  assert.doesNotMatch(page, /ListingEarningsCard|ListingQualityCard|ListingShipping/);
 } finally {await server.close();}
});
