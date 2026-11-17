import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value), removeItem: key => values.delete(key) }; };
test('Google OAuth uses backend code exchange, tab intent and existing session validation', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const oldFetch = globalThis.fetch;
  const oldLocal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldTab = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'localStorage', { value: memory(), configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: memory(), configurable: true });
  try {
    const api = await server.ssrLoadModule('/src/features/auth/services/auth.api.ts');
    const code = 'a'.repeat(32);
    let calls = 0, last;
    const wire = { accessToken: 'test-not-real', tokenType: 'Bearer', expiresIn: 60, user: { id: 'u', email: 'user@example.test', fullName: 'User', status: 'ACTIVE', roles: ['BUYER'] } };
    globalThis.fetch = async (url, options) => { calls++; last = { url, options }; return Response.json(wire); };
    await assert.rejects(api.completeGoogleSignIn('?code=' + code));
    assert.equal(calls, 0, 'unsolicited callbacks must not exchange');
    assert.ok(api.beginGoogleSignIn('buyer', false).endsWith('/oauth2/authorization/google?role=BUYER'));
    const result = await api.completeGoogleSignIn('?code=' + code + '&newUser=false');
    assert.equal(result.role, 'buyer');
    assert.ok(last.url.endsWith('/api/v1/auth/oauth2/exchange'));
    assert.equal(last.options.method, 'POST');
    assert.deepEqual(JSON.parse(last.options.body), { code });
    assert.ok(!new Headers(last.options.headers).has('Authorization'));
    assert.equal(api.getSession().accessToken, wire.accessToken);
    assert.equal(localStorage.getItem('nexus.auth.session'), null);
    api.clearSession();
    await assert.rejects(api.completeGoogleSignIn('?code=' + code));
    for (const query of ['?error=oauth2_failed', '?code=token', '?code=' + code + '&code=' + code, '?code=' + code + '&accessToken=secret', '?code=' + code + '&newUser=invalid']) {
      api.beginGoogleSignIn('buyer', true);
      const before = calls;
      await assert.rejects(api.completeGoogleSignIn(query));
      assert.equal(calls, before);
      assert.equal(api.getSession(), null);
    }
    api.beginGoogleSignIn('buyer', true);
    const key = 'nexus.auth.google-intent';
    sessionStorage.setItem(key, JSON.stringify({ role: 'buyer', remember: true, createdAt: Date.now() - 16 * 60 * 1000 }));
    await assert.rejects(api.completeGoogleSignIn('?code=' + code));
    api.beginGoogleSignIn('seller', true);
    await assert.rejects(api.completeGoogleSignIn('?code=' + code), error => error.status === 403);
    assert.equal(api.getSession(), null);
    api.beginGoogleSignIn('buyer', true);
    globalThis.fetch = async () => Response.json({ message: 'Expired code' }, { status: 401 });
    await assert.rejects(api.completeGoogleSignIn('?code=' + code), error => error.status === 401);
    assert.equal(api.getSession(), null);
    for (const cancel of ['unmount', 'logout', 'new-login']) {
      api.beginGoogleSignIn('buyer', true); let respond; let active = true;
      globalThis.fetch = () => new Promise(resolve => { respond = resolve; });
      const pending = api.completeGoogleSignIn('?code=' + code, () => active);
      if (cancel === 'unmount') active = false;
      else if (cancel === 'logout') api.clearSession();
      else api.beginGoogleSignIn('seller', false);
      respond(Response.json(wire));
      await assert.rejects(pending, error => error.name === 'AbortError');
      assert.equal(api.getSession(), null, 'late callbacks must not install a cancelled session');
    }
    api.beginGoogleSignIn('buyer', true);
    globalThis.fetch = async () => Response.json({ ...wire, expiresIn: 0 });
    await assert.rejects(api.completeGoogleSignIn('?code=' + code));
    assert.equal(api.getSession(), null);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldLocal) Object.defineProperty(globalThis, 'localStorage', oldLocal); else delete globalThis.localStorage;
    if (oldTab) Object.defineProperty(globalThis, 'sessionStorage', oldTab); else delete globalThis.sessionStorage;
    await server.close();
  }
});
