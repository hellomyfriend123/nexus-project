import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

test('listing validates backend image MIME and size limits', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { validateListingImage } = await server.ssrLoadModule('/src/features/seller-listing/services/listingMedia.ts');
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) assert.equal(validateListingImage({type,size:5*1024*1024}),null);
    for (const file of [{type:'image/svg+xml',size:10},{type:'image/jpeg',size:0},{type:'image/png',size:5*1024*1024+1}]) assert.ok(validateListingImage(file));
  } finally { await server.close(); }
});

test('partial upload caches successful URLs and PUT failure retries attachment without reupload', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { persistListingImages } = await server.ssrLoadModule('/src/features/seller-listing/services/listingMedia.ts');
    const media = ['a','b'].map(id=>({id,file:{name:id,size:10,type:'image/jpeg'}}));
    const cache = new Map();const uploads=[];let failUpload=true;let failAttach=true;
    const upload=async(id,file)=>{assert.equal(id,'product');uploads.push(file.name);if(file.name==='b'&&failUpload)throw Error('upload');return 'https://images/'+file.name;};
    const attachments=[];const attach=async(images)=>{attachments.push(images);if(failAttach)throw Error('attach');};
    await assert.rejects(persistListingImages('product',media,cache,upload,attach),/upload/);
    assert.equal(cache.get('a'),'https://images/a');assert.equal(attachments.length,0);
    failUpload=false;await assert.rejects(persistListingImages('product',media,cache,upload,attach),/attach/);
    failAttach=false;await persistListingImages('product',media,cache,upload,attach);
    assert.deepEqual(uploads,['a','b','b']);assert.deepEqual(attachments[1],[{imageUrl:'https://images/a',primary:true},{imageUrl:'https://images/b',primary:false}]);
  } finally { await server.close(); }
});

test('upload uses authenticated shared multipart transport and validates publicUrl without product adapter', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const original = globalThis.fetch;
  try {
    const { sellerApi } = await server.ssrLoadModule('/src/features/seller-hub/services/seller.api.ts');
    let calls=0;
    globalThis.fetch=async(url, options)=>{
      calls++;assert.equal(url,'/api/v1/seller/catalog/products/p%2Fid/images/upload');assert.equal(options.method,'POST');
      assert.ok(options.body instanceof FormData);assert.equal(options.body.get('file').name,'photo.jpg');assert.equal(options.headers.has('Content-Type'),false);
      return Response.json({publicUrl:'https://storage.example/photo.jpg'});
    };
    assert.equal(await sellerApi.uploadProductImage('p/id',new File(['photo'],'photo.jpg',{type:'image/jpeg'})),'https://storage.example/photo.jpg');assert.equal(calls,1);
    globalThis.fetch=async()=>Response.json({publicUrl:'blob:local'});
    await assert.rejects(sellerApi.uploadProductImage('p',new File(['photo'],'photo.jpg')),/không hợp lệ/);
  } finally {globalThis.fetch=original;await server.close();}
});


test('removing every image after an attachment failure clears persisted images on retry', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { persistListingImages } = await server.ssrLoadModule('/src/features/seller-listing/services/listingMedia.ts');
    const attachments = []; const cache = new Map([['a', 'https://images/a']]);
    const upload = async () => { throw Error('must not reupload'); };
    await assert.rejects(persistListingImages('product', [{id:'a'}], cache, upload, async images => { attachments.push(images); throw Error('lost response'); }), /lost response/);
    await persistListingImages('product', [], cache, upload, async images => attachments.push(images));
    assert.deepEqual(attachments, [[{imageUrl:'https://images/a', primary:true}], []]);
  } finally { await server.close(); }
});

test('missing or invalid files never become preview URLs in persisted media', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { persistListingImages } = await server.ssrLoadModule('/src/features/seller-listing/services/listingMedia.ts');
    const forbidden = async () => assert.fail('must not write invalid media');
    await assert.rejects(persistListingImages('p', [{id:'missing',image:'blob:local'}], new Map(), forbidden, forbidden));
    await assert.rejects(persistListingImages('p', [{id:'svg',file:{size:1,type:'image/svg+xml'}}], new Map(), forbidden, forbidden));
  } finally { await server.close(); }
});

test('listing hook wires file previews and guarded cached attachment before SKU creation', async () => {
  const source = await readFile(new URL('../src/features/seller-listing/hooks/useCreateListing.ts', import.meta.url), 'utf8');
  assert.ok(source.includes('URL.createObjectURL(file)'));
  assert.ok(source.includes('validateListingImage(file)'));
  assert.ok(source.includes('URL.revokeObjectURL(item.image)'));
  assert.ok(source.includes('urls.current.forEach(url => URL.revokeObjectURL(url))'));
  assert.ok(source.includes('MAX_LISTING_IMAGES'));
  assert.ok(source.includes('persistListingImages(id,mediaRef.current,uploadedImages.current,sellerApi.uploadProductImage'));
  assert.ok(source.includes('sellerApi.updateProduct(id,{name:input.name,description:input.description,basePrice:input.basePrice,images})'));
  const submit = source.slice(source.indexOf('async function submitListing()'));
  assert.ok(submit.indexOf('assertProductRetryMatches') < submit.indexOf('persistListingImages'));
  assert.ok(submit.indexOf('persistListingImages') < submit.indexOf('await sellerApi.createSku'));
  assert.ok(submit.indexOf('pendingProduct.current=null') > submit.indexOf('await sellerApi.createSku'));
});
