import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {MemoryRouter} from 'react-router-dom';import {createServer} from 'vite';
test('seller-hub-integration.test.mjs preserves seller shell without fabricated data',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
 try{const {default:AppRoutes}=await server.ssrLoadModule('/src/app/routes/AppRoutes.tsx');const html=renderToStaticMarkup(createElement(MemoryRouter,{initialEntries:['/seller-hub']},createElement(AppRoutes)));
 assert.ok(html.includes('nx-seller-layout'));assert.ok(html.includes('nx-seller-page'));
 for(const label of ["Kênh người bán","Đang tải dữ liệu bán hàng","Quản lý kho hàng"])assert.ok(html.includes(label),label);
 assert.doesNotMatch(html,/seller-listing-form|Báo cáo|Hiệu suất Shop|Nexus Guarantee/);
 assert.equal((html.match(/<header class="nexus-header/g)||[]).length,1);assert.equal((html.match(/<footer class="nexus-footer/g)||[]).length,1);
 assert.doesNotMatch(html,/Dell XPS 15 9530|NX-VN-88402|#ORD-2025-8839|128 sản phẩm/);

 }finally{await server.close();}
});

test('seller hub new-product button navigates to the full listing page', () => {
 const source = readFileSync(new URL('../src/features/seller-hub/pages/SellerHubPage.tsx', import.meta.url), 'utf8');
 assert.match(source, /to="\/seller\/products\/new"/);
 assert.match(source, /to="\/seller\/products"/);
 assert.doesNotMatch(source, /onCreateProduct=\{hub\.focusListing\}/);
});
