import assert from 'node:assert/strict';
import { test } from 'node:test';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {MemoryRouter} from 'react-router-dom';import {createServer} from 'vite';
// The create form now lives in a dialog opened from the inventory list. A direct visit to the
// legacy /seller/products/new URL must still work: the inventory page renders underneath and the
// dialog opens on top of it.
test('seller-listing-integration.test.mjs legacy create URL renders the inventory list with the create dialog open',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
 try{const {default:AppRoutes}=await server.ssrLoadModule('/src/app/routes/AppRoutes.tsx');const html=renderToStaticMarkup(createElement(MemoryRouter,{initialEntries:['/seller/products/new']},createElement(AppRoutes)));
 assert.ok(html.includes('nx-seller-layout'));
 // Background list, not a dead page.
 assert.ok(html.includes('nx-stock-page'));
 // The dialog and every field it contains.
 assert.ok(html.includes('nx-modal'));
 assert.ok(html.includes('Thêm sản phẩm'));
 for(const label of ["listing-title","listing-category","listing-sku","listing-price","listing-quantity"])assert.ok(html.includes(label),label);
 assert.equal((html.match(/<header class="nexus-header/g)||[]).length,1);assert.equal((html.match(/<footer class="nexus-footer/g)||[]).length,1);
 assert.doesNotMatch(html,/Dell XPS 15 9530|NX-VN-88402|#ORD-2025-8839|128 sản phẩm/);
 assert.equal((html.match(/class="nx-listing-step"/g)||[]).length,3);
 assert.doesNotMatch(html,/nx-listing-aside|listing-brand|listing-weight|Lưu Nháp|Nexus AI|Fast-Track|Escrow|Chất lượng tin đăng|Dự tính thực nhận/);
 }finally{await server.close();}
});
