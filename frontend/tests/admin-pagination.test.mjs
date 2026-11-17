import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const page = (content, index = 0, totalPages = 1) => ({ content, page: index, totalPages, last: index + 1 >= totalPages });

test('admin pagination honors backend page counts, capped sizes, empty pages and invalidation', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { loadAllAdminPages } = await server.ssrLoadModule('/src/features/admin/services/adminPagination.ts');
    const calls = [];
    const result = await loadAllAdminPages(async params => { calls.push(params); return page([params.page], params.page, 3); });
    assert.deepEqual(result.content, [0, 1, 2]);
    assert.deepEqual(calls, [0, 1, 2].map(page => ({ page, size: 100 })));
    assert.deepEqual((await loadAllAdminPages(async () => page([]))).content, []);
    await assert.rejects(loadAllAdminPages(async () => ({ content: null })), /Invalid admin page/);
    const pending = deferred(); let current = true; let count = 0;
    const stale = loadAllAdminPages(() => { count++; return pending.promise; }, () => current);
    current = false; pending.resolve(page(['old'], 0, 5));
    assert.deepEqual((await stale).content, []); assert.equal(count, 1);
    await assert.rejects(loadAllAdminPages(async ({ page: p }) => { if (p) throw Error('later page failed'); return page(['first'], 0, 2); }), /later page failed/);
  } finally { await server.close(); }
});

test('admin hooks ignore superseded list errors and completion, and user phone search includes later pages', async () => {
  let states = [], refs = [], cursor = 0, refCursor = 0, effects = [];
  globalThis.__adminHookHarness = {
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useRef(initial) { const i = refCursor++; return refs[i] ||= { current: initial }; },
    useCallback(fn) { return fn; }, useEffect(fn) { effects.push(fn); },
  };
  globalThis.__adminApiMock = {};
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', plugins: [{ name: 'admin-hook-test', enforce: 'pre',
    transform(code, id) { if (id.includes('/features/admin/hooks/')) return code.replace(/import \{([^}]+)\} from 'react';/, 'const {$1} = globalThis.__adminHookHarness;').replace(/import \{ (admin\w+Api) \} from '..\/services\/admin.service';/, (_, name) => 'const ' + name + ' = globalThis.__adminApiMock.' + (name === 'adminAuctionApi' ? 'auctions' : 'users') + ';'); },
    resolveId(id) { if (id === 'react') return '\0admin-test-react'; if (id.endsWith('/services/admin.service')) return '\0admin-test-api'; },
    load(id) { if (id === '\0admin-test-react') return 'export const { useState, useRef, useCallback, useEffect } = globalThis.__adminHookHarness;'; if (id === '\0admin-test-api') return 'export const adminAuctionApi = globalThis.__adminApiMock.auctions; export const adminUsersApi = globalThis.__adminApiMock.users;'; },
  }] });
  const render = hook => { cursor = 0; refCursor = 0; effects = []; return hook(); };
  try {
    const old = deferred(), fresh = deferred(); let calls = 0;
    globalThis.__adminApiMock.auctions = { list: () => (++calls === 1 ? old.promise : fresh.promise) };
    const { useAdminAuctions } = await server.ssrLoadModule('/src/features/admin/hooks/useAdminAuctions.ts');
    let hook = render(useAdminAuctions);
    const oldRequest = hook.loadAuctions(), freshRequest = hook.loadAuctions();
    old.reject(Error('stale failure')); await oldRequest;
    hook = render(useAdminAuctions); assert.equal(hook.loading, true); assert.equal(hook.error, null);
    fresh.resolve(page([{ id: 'new', status: 'ACTIVE' }])); await freshRequest;
    hook = render(useAdminAuctions); assert.equal(hook.auctions[0].id, 'new'); assert.equal(hook.loading, false);
    states = []; refs = [];
    const requested = [];
    globalThis.__adminApiMock.users = { list: async params => { requested.push(params); return page([{ id: params.page ? 'match' : 'first', fullName: 'User', status: 'ACTIVE' }], params.page, 2); }, getById: async id => ({ id, phone: id === 'match' ? '0901234567' : '0800000000' }) };
    const { useAdminUsers } = await server.ssrLoadModule('/src/features/admin/hooks/useAdminUsers.ts');
    let users = render(useAdminUsers); users.setSearchKeyword('090123'); users = render(useAdminUsers); await users.fetchUsers(); users = render(useAdminUsers);
    assert.deepEqual(users.users.map(u => u.id), ['match']); assert.equal(requested.length, 2); assert.ok(requested.every(p => p.keyword === undefined));
  } finally { await server.close(); delete globalThis.__adminHookHarness; delete globalThis.__adminApiMock; }
});
