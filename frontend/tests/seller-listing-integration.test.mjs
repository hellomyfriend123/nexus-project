import assert from 'node:assert/strict';
import { test } from 'node:test';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {MemoryRouter} from 'react-router-dom';import {createServer} from 'vite';
test('seller-listing-integration.test.mjs preserves seller shell without fabricated data',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
 try{const {default:AppRoutes}=await server.ssrLoadModule('/src/app/routes/AppRoutes.tsx');const html=renderToStaticMarkup(createElement(MemoryRouter,{initialEntries:['/seller/products/new']},createElement(AppRoutes)));
 assert.ok(html.includes('nx-seller-layout'));assert.ok(html.includes('nx-listing-page'));
 for(const label of ["Chưa có API đánh giá","Chỉ lưu tên, mô tả, danh mục, giá mua ngay, mã SKU tự động và tồn kho.","listing-title","Hệ thống sẽ tự động cấp mã khi đăng sản phẩm."])assert.ok(html.includes(label),label);
 assert.ok(!html.includes('listing-sku'));
 assert.equal((html.match(/<header class="nexus-header/g)||[]).length,1);assert.equal((html.match(/<footer class="nexus-footer/g)||[]).length,1);
 assert.doesNotMatch(html,/Dell XPS 15 9530|NX-VN-88402|#ORD-2025-8839|128 sản phẩm/);
 assert.equal((html.match(/class="nx-listing-step"/g)||[]).length,5);const aside=html.match(/<aside class="nx-listing-aside">([\s\S]*?)<\/aside>/);assert.ok(aside);assert.equal((aside[1].match(/<section\b/g)||[]).length,4);
 }finally{await server.close();}
});
