import assert from 'node:assert/strict';
import { test } from 'node:test';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {MemoryRouter} from 'react-router-dom';import {createServer} from 'vite';
test('seller-hub-integration.test.mjs preserves seller shell without fabricated data',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
 try{const {default:AppRoutes}=await server.ssrLoadModule('/src/app/routes/AppRoutes.tsx');const html=renderToStaticMarkup(createElement(MemoryRouter,{initialEntries:['/seller-hub']},createElement(AppRoutes)));
 assert.ok(html.includes('nx-seller-layout'));assert.ok(html.includes('nx-seller-page'));
 for(const label of ["Trung tâm Quản lý Bán hàng","Đang tải dữ liệu bán hàng","seller-listing-form"])assert.ok(html.includes(label),label);
 assert.equal((html.match(/<header class="nexus-header/g)||[]).length,1);assert.equal((html.match(/<footer class="nexus-footer/g)||[]).length,1);
 assert.doesNotMatch(html,/Dell XPS 15 9530|NX-VN-88402|#ORD-2025-8839|128 sản phẩm/);

 }finally{await server.close();}
});
