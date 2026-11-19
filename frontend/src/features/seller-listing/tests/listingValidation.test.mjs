import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// Import the pure validator without requiring a browser or React test runtime.
const source = readFileSync(new URL('../hooks/listingValidation.ts', import.meta.url), 'utf8').replace(/^import type.*\n/m, '').replace('draft: ListingDraftForm, category: string, saleModes: string[]', 'draft, category, saleModes').replace('const next: string[]', 'const next');
const { validateListing } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const valid = {title:'Camera',description:'A working camera',price:100,dealPrice:90,minOffer:80,quantity:1};
test('valid fixed listing passes without deal or offer prices', () => assert.deepEqual(validateListing({...valid,dealPrice:0,minOffer:0},'camera',['fixed']), []));
test('required title description category rejected', () => assert.equal(validateListing({...valid,title:' ',description:' '},'', ['fixed']).length,3));
test('finite positive price and integer quantity enforced', () => {for (const price of [0,-1,NaN,Infinity]) assert.ok(validateListing({...valid,price},'camera',['fixed']).length);for(const quantity of [0,-1,1.5,100,Infinity]) assert.ok(validateListing({...valid,quantity},'camera',['fixed']).length);});
test('unsupported sale modes are rejected', () => {for (const modes of [[], ['auction'], ['fixed','offer']]) assert.ok(validateListing(valid,'camera',modes).length);});
test('backend decimal scale and safe numeric transport are enforced', () => {
 for (const price of [0.01, 12.34, 100]) assert.deepEqual(validateListing({...valid,price},'camera',['fixed']), []);
 for (const price of [0.001, 12.345, 10000000000000000, Number.MAX_VALUE]) assert.ok(validateListing({...valid,price},'camera',['fixed']).length);
});
