import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { createServer } from 'vite';

const render = (element, path = '/buyer/profile') =>
  renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, element));

test('actual workspace routes retain account navigation and one active desktop item', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: sellerRoutes } = await server.ssrLoadModule('/src/roles/seller/routes.tsx');
    const { default: buyerRoutes } = await server.ssrLoadModule('/src/roles/buyer/routes.tsx');
    function Routes({ routes }) { return useRoutes(routes); }
    for (const [path, label] of [
      ['/seller-hub', 'Sản phẩm &amp; tồn kho'],
      ['/seller-hub?tab=orders', 'Đơn bán'],
      ['/seller-hub?tab=auctions', 'Phiên đấu giá'],
      ['/seller/products', 'Sản phẩm &amp; tồn kho'],
      ['/seller/products/new', 'Sản phẩm &amp; tồn kho'],
    ]) {
      const html = render(createElement(Routes, { routes: sellerRoutes }), path);
      const nav = html.match(/<nav[^>]*aria-label="Tài khoản người bán"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
      assert.ok(nav, `missing sidebar at ${path}`);
      assert.equal((nav.match(/aria-current="page"/g) ?? []).length, 1, path);
      assert.match(nav, new RegExp(`aria-current="page"[^>]*>[\\s\\S]*?<span>${label}</span>`));
      for (const name of ['Hồ sơ cá nhân', 'Địa chỉ', 'Đổi mật khẩu', 'Đơn bán', 'Phiên đấu giá']) assert.ok(nav.includes(name));
      if (path.endsWith('tab=orders')) assert.match(html, /id="hub-panel-orders"/);
      if (path.endsWith('tab=auctions')) assert.match(html, /id="hub-panel-auctions"/);
    }
    const buyer = render(createElement(Routes, { routes: buyerRoutes }), '/buyer-hub');
    assert.match(buyer, /aria-label="Tài khoản người mua"/);
    assert.match(buyer, /Đấu giá đã tham gia/);
  } finally { await server.close(); }
});

test('profile update sends null for untouched fields and empty string only to clear', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { buildProfileUpdate, validateProfileDraft } = await server.ssrLoadModule('/src/features/account/hooks/useAccountProfile.ts');
    const original = { fullName: 'Nguyễn Văn A', phone: '0901234567', address: 'Hà Nội', dateOfBirth: '1990-01-01', gender: 'MALE' };
    // Nothing changed: the PUT body must be empty so untouched columns are never overwritten.
    assert.deepEqual(buildProfileUpdate(original, { ...original }), {});
    // Only the changed field travels.
    assert.deepEqual(buildProfileUpdate(original, { ...original, fullName: 'Nguyễn Văn B' }), { fullName: 'Nguyễn Văn B' });
    // Clearing an address is expressed as "" (backend trims it to null).
    assert.deepEqual(buildProfileUpdate(original, { ...original, address: '   ' }), { address: '' });
    // Whitespace-only edits are not a change at all.
    assert.deepEqual(buildProfileUpdate(original, { ...original, fullName: '  Nguyễn Văn A  ' }), {});
    // dateOfBirth/gender are not strings on the wire, so an empty value is left untouched.
    assert.deepEqual(buildProfileUpdate(original, { ...original, dateOfBirth: '', gender: '' }), {});
  } finally { await server.close(); }
});

test('profile validation mirrors the backend request constraints', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { validateProfileDraft } = await server.ssrLoadModule('/src/features/account/hooks/useAccountProfile.ts');
    const valid = { fullName: 'Nguyễn Văn A', phone: '', address: '', dateOfBirth: '', gender: '' };
    assert.deepEqual(validateProfileDraft(valid), []);
    // fullName is required and capped at 150; the backend rejects an empty one too.
    assert.match(validateProfileDraft({ ...valid, fullName: '   ' })[0], /Họ tên/);
    assert.match(validateProfileDraft({ ...valid, fullName: 'a'.repeat(151) })[0], /150/);
    // RegisterRequest.PHONE_PATTERN
    assert.match(validateProfileDraft({ ...valid, phone: 'abc' })[0], /Số điện thoại/);
    assert.deepEqual(validateProfileDraft({ ...valid, phone: '+84 901 234 567' }), []);
    // @Size(max = 255) on address
    assert.match(validateProfileDraft({ ...valid, address: 'a'.repeat(256) })[0], /255/);
    // @Past on dateOfBirth
    assert.match(validateProfileDraft({ ...valid, dateOfBirth: '2999-01-01' })[0], /quá khứ/);
  } finally { await server.close(); }
});

test('account sidebar marks exactly one section active, including hub sections split by ?tab=', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { isMenuItemActive, resolveActiveMenuItem } = await server.ssrLoadModule('/src/shared/components/AccountLayout/AccountSidebar.tsx');
    const { sellerAccountMenu } = await server.ssrLoadModule('/src/features/seller-hub/constants/accountMenu.ts');
    const { buyerAccountMenu } = await server.ssrLoadModule('/src/features/buyer-hub/constants/accountMenu.ts');

    const activeFor = (menu, pathname, search) => menu.filter(item => isMenuItemActive(item, pathname, search)).map(item => item.label);
    const resolvedFor = (menu, pathname, search) => resolveActiveMenuItem(menu, pathname, search)?.label;

    // Seller hub entries share a path and must be told apart by the query.
    assert.deepEqual(activeFor(sellerAccountMenu, '/seller-hub', '?tab=orders'), ['Đơn bán']);
    assert.deepEqual(activeFor(sellerAccountMenu, '/seller-hub', '?tab=auctions'), ['Phiên đấu giá']);
    assert.deepEqual(activeFor(sellerAccountMenu, '/seller-hub', '?tab=products'), ['Sản phẩm & tồn kho']);
    // A bare /seller-hub has no ?tab, so the query entries do not match: the resolver falls back
    // to the first entry on that path instead of highlighting nothing.
    assert.deepEqual(activeFor(sellerAccountMenu, '/seller-hub', ''), []);
    assert.equal(resolvedFor(sellerAccountMenu, '/seller-hub', ''), 'Sản phẩm & tồn kho');
    // A ?tab that no entry declares (e.g. ?tab=reports) also resolves instead of going blank.
    assert.equal(resolvedFor(sellerAccountMenu, '/seller-hub', '?tab=unknown'), 'Sản phẩm & tồn kho');
    // Child routes keep their parent active; the hub index does not.
    assert.deepEqual(activeFor(sellerAccountMenu, '/seller/profile', ''), ['Hồ sơ cá nhân']);
    assert.deepEqual(activeFor(buyerAccountMenu, '/buyer-hub', ''), ['Đơn mua']);
    assert.deepEqual(activeFor(buyerAccountMenu, '/buyer/address', ''), ['Địa chỉ nhận hàng']);
    assert.equal(resolvedFor(buyerAccountMenu, '/buyer-hub', ''), 'Đơn mua');
    // Account child routes must not steal the hub entry.
    assert.equal(resolvedFor(buyerAccountMenu, '/buyer/profile', ''), 'Hồ sơ cá nhân');
    assert.equal(resolvedFor(sellerAccountMenu, '/seller/address', ''), 'Địa chỉ');
  } finally { await server.close(); }
});

test('blocked account sections report the missing endpoint and offer no save control', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: PasswordPage } = await server.ssrLoadModule('/src/features/account/pages/PasswordPage.tsx');
    const { default: BuyerAuctionsPage } = await server.ssrLoadModule('/src/features/account/pages/BuyerAuctionsPage.tsx');
    const password = render(createElement(PasswordPage));
    assert.match(password, /Tính năng chưa được hỗ trợ/);
    assert.match(password, /\/api\/v1\/auth\/change-password/);
    // No form means no way to type a password into a control that cannot persist it.
    assert.doesNotMatch(password, /<input|<form|Lưu mật khẩu|Đang lưu/);

    const auctions = render(createElement(BuyerAuctionsPage));
    assert.match(auctions, /Tính năng chưa được hỗ trợ/);
    assert.doesNotMatch(auctions, /<form|Đang lưu/);
  } finally { await server.close(); }
});

test('profit: the legacy seller create URLs render the list behind the dialog exactly once', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: AppRoutes } = await server.ssrLoadModule('/src/app/routes/AppRoutes.tsx');
    for (const path of ['/seller/products/new', '/seller/auctions/new']) {
      const html = render(createElement(AppRoutes), path);
      assert.equal((html.match(/class="nx-modal /g) || []).length, 1, `${path} must mount one dialog`);
      assert.match(html, /nx-seller-layout/);
      assert.match(html, /id="sca-form"|id="nx-listing-form"/);
    }
    // The auction deep link still preselects from the query the inventory row produces.
    assert.match(render(createElement(AppRoutes), '/seller/auctions/new?productId=abc'), /Tạo phiên đấu giá/);
  } finally { await server.close(); }
});
