import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// Import the pure validator without requiring a browser or React test runtime.
const source = readFileSync(new URL('../hooks/listingValidation.ts', import.meta.url), 'utf8').replace(/^import type.*\n/m, '').replace('draft: ListingDraftForm, category: string, saleModes: string[]', 'draft, category, saleModes').replace('const next: string[]', 'const next');
const { validateListing } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const valid = {title:'Camera',description:'A working camera',price:100,dealPrice:90,minOffer:80,quantity:1};
test('valid fixed and offer listing passes', () => assert.deepEqual(validateListing(valid,'camera',['fixed','offer']), []));
test('required title description category rejected', () => assert.equal(validateListing({...valid,title:' ',description:' '},'', ['fixed']).length,3));
test('finite positive price and integer quantity enforced', () => {for (const price of [0,-1,NaN,Infinity]) assert.ok(validateListing({...valid,price},'camera',['fixed']).length);for(const quantity of [0,-1,1.5,100,Infinity]) assert.ok(validateListing({...valid,quantity},'camera',['fixed']).length);});
test('sale mode and deal/offer bounds enforced', () => {assert.ok(validateListing(valid,'camera',[]).length);assert.ok(validateListing(valid,'camera',['auction']).length);assert.ok(validateListing({...valid,dealPrice:101},'camera',['fixed']).length);assert.ok(validateListing({...valid,minOffer:91},'camera',['fixed','offer']).length);});
