import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('shared transport preserves backend DTOs, handles JSON/204/errors/auth/abort', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const originalFetch = globalThis.fetch;
  const oldLocal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldSession = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const storage = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) }; };
  Object.defineProperty(globalThis, 'localStorage', { value: storage(), configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: storage(), configurable: true });
  try {
    const { api, ApiError, apiErrorMessage } = await server.ssrLoadModule('/src/services/api/client.ts');
    const auth = await server.ssrLoadModule('/src/features/auth/services/auth.api.ts');
    const session = { userId: 'test-only', email: 'test@example.com', fullName: 'Test', roles: ['BUYER'], accessToken: 'test-only-token', tokenType: 'Bearer', expiresAt: new Date(Date.now()+60000).toISOString() };
    assert.match(apiErrorMessage(new ApiError(400, 'Dữ liệu không hợp lệ', [{ field: 'receiverPhone', message: 'Phone invalid' }])), /receiverPhone: Phone invalid/);
    auth.saveSession(session, false);
    let last;
    globalThis.fetch = async (url, options) => { last = { url, options }; return Response.json({ content: [{ id: 'returned-id' }], totalPages: 1 }); };
    assert.deepEqual(await api('/api/v1/catalog/products'), { content: [{ id: 'returned-id' }], totalPages: 1 });
    assert.equal(last.options.headers.get('Authorization'), 'Bearer test-only-token');
    assert.equal(last.options.headers.get('Accept'), 'application/json');
    await api('/api/v1/buyer/commerce/cart/items', { method: 'POST', body: JSON.stringify({ quantity: 2 }) });
    assert.equal(last.options.headers.get('Content-Type'), 'application/json');
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(await api('/api/v1/auth/logout', { method: 'POST' }), null);
    globalThis.fetch = async () => Response.json({ message: 'Denied', details: [{ field: 'x' }] }, { status: 403 });
    await assert.rejects(api('/api/v1/catalog/products'), e => e instanceof ApiError && e.status === 403 && e.message === 'Denied');
    assert.ok(auth.getSession());
    globalThis.fetch = async () => Response.json({ error: 'BUSINESS_RULE_VIOLATION', message: 'Backend rule', details: [] }, { status: 422 });
    await assert.rejects(api('/api/v1/buyer/commerce/cart'), e => e.status === 422 && e.code === 'BUSINESS_RULE_VIOLATION' && e.message === 'Backend rule');
    globalThis.fetch = async () => ({ status: 200, ok: true, text: async () => { throw new TypeError('stream closed'); } });
    await assert.rejects(api('/api/v1/catalog/products'), e => e instanceof ApiError && e.status === 0);
    globalThis.fetch = async () => Response.json({ message: 'Expired' }, { status: 401 });
    await assert.rejects(api('/api/v1/catalog/products'), e => e.status === 401);
    assert.equal(auth.getSession(), null);
    globalThis.fetch = async () => new Response('<html>not json</html>');
    await assert.rejects(api('/api/v1/catalog/products'), /Phản hồi máy chủ/);
    globalThis.fetch = async () => { throw new TypeError('network'); };
    await assert.rejects(api('/api/v1/catalog/products'), e => e.status === 0);
    const controller = new AbortController(); controller.abort();
    const aborted = new DOMException('Aborted', 'AbortError');
    globalThis.fetch = async () => { throw aborted; };
    await assert.rejects(api('/api/v1/catalog/products', { signal: controller.signal }), e => e === aborted);
    await assert.rejects(api('https://unapproved.example'), /Invalid API path/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, descriptor] of [['localStorage', oldLocal], ['sessionStorage', oldSession]]) { if (descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key]; }
    await server.close();
  }
});
