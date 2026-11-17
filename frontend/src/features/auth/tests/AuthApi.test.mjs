import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key), clear: () => values.clear() };
};

test('real API adapter: payloads, errors, persistence, expiry, abort and logout', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const originalFetch = globalThis.fetch;
  const oldLocal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldSession = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage(), configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: memoryStorage(), configurable: true });
  try {
    const api = await server.ssrLoadModule('/src/features/auth/services/auth.api.ts');
    const wireUser = { id: 'id', username: 'testuser', email: 'test@example.com', fullName: 'Test User', roles: ['BUYER'], status: 'ACTIVE' };
    const user = { userId: wireUser.id, ...Object.fromEntries(Object.entries(wireUser).filter(([key]) => key !== 'id')) };
    let session;
    const wireSession = (profile = wireUser) => ({ accessToken: 'test-token-not-real', tokenType: 'Bearer', expiresIn: 60, user: profile });
    const input = { username: ' testuser ', fullName: ' Test User ', email: ' test@example.com ', phone: '', password: 'not-a-real-password', confirmPassword: 'not-a-real-password', role: 'buyer' };
    let last;
    globalThis.fetch = async (url, options) => { last = { url, options }; return Response.json(wireUser, { status: 201 }); };
    assert.deepEqual(await api.register(input), user);
    assert.ok(last.url.endsWith('/api/v1/auth/register'));
    assert.deepEqual(JSON.parse(last.options.body), { username: 'testuser', fullName: 'Test User', email: 'test@example.com', password: input.password, phone: null, role: 'BUYER' });
    assert.equal(api.getSession(), null, 'register must not authenticate');
    // Current backend LoginResponse/MeResponse do not include username.
    const wireUserWithoutUsername = { ...wireUser };
    delete wireUserWithoutUsername.username;
    const userWithoutUsername = { ...user };
    delete userWithoutUsername.username;
    globalThis.fetch = async () => Response.json(wireUserWithoutUsername, { status: 201 });
    assert.deepEqual(await api.register(input), userWithoutUsername);
    assert.equal(api.getSession(), null, 'register without username must not authenticate');
    globalThis.fetch = async () => Response.json(wireSession(wireUserWithoutUsername));
    session = await api.login({ identifier: 'test@example.com', password: input.password, role: 'buyer' }, false);
    assert.equal(session.userId, user.userId);
    assert.ok(Date.parse(session.expiresAt) > Date.now());
    assert.equal(session.username, undefined);
    assert.deepEqual(api.getSession(), session);
    globalThis.fetch = async () => Response.json(wireUserWithoutUsername);
    assert.deepEqual(await api.me(), userWithoutUsername);
    api.saveSession(session, true);
    assert.deepEqual(api.getSession(), session);
    api.clearSession();
    // Optional does not mean arbitrary types, and core session checks remain mandatory.
    assert.throws(() => api.saveSession({ ...session, username: 123 }, true));
    for (const field of ['userId', 'email', 'fullName', 'accessToken', 'tokenType', 'expiresAt', 'roles']) {
      const invalid = { ...session };
      delete invalid[field];
      assert.throws(() => api.saveSession(invalid, true), `missing ${field} must be rejected`);
    }
    for (const accessToken of [123, {}, '   ']) {
      assert.throws(() => api.saveSession({ ...session, accessToken }, true));
    }
    const details = [{ field: 'email', message: 'Already registered' }];
    globalThis.fetch = async () => Response.json({ message: 'Duplicate account', details }, { status: 409 });
    await assert.rejects(api.register(input), (e) => e.status === 409 && e.message === 'Duplicate account' && e.details[0].field === 'email');
    globalThis.fetch = async () => Response.json({ message: 'Invalid credentials' }, { status: 401 });
    await assert.rejects(api.login({ identifier: 'testuser', password: input.password, role: 'buyer' }, false), (e) => e.status === 401);
    assert.equal(api.getSession(), null);
    globalThis.fetch = async (url, options) => { last = { url, options }; return Response.json(wireSession()); };
    await api.login({ identifier: ' testuser ', password: input.password, role: 'buyer' }, false);
    assert.deepEqual(JSON.parse(last.options.body), { email: 'testuser', password: input.password });
    assert.equal(localStorage.getItem('nexus.auth.session'), null);
    assert.ok(sessionStorage.getItem('nexus.auth.session'));
    assert.ok(!sessionStorage.getItem('nexus.auth.session').includes(input.password));
    api.saveSession({ ...session, password: input.password }, true);
    assert.equal(sessionStorage.getItem('nexus.auth.session'), null);
    assert.ok(!localStorage.getItem('nexus.auth.session').includes(input.password));
    globalThis.fetch = async (url, options) => { last = { url, options }; return Response.json(wireUser); };
    assert.deepEqual(await api.me(), user);
    assert.equal(new Headers(last.options.headers).get('Authorization'), 'Bearer ' + session.accessToken);
    globalThis.fetch = async () => new Response(null, { status: 204 });
    await api.logout();
    assert.equal(api.getSession(), null);
    api.saveSession(session, true);
    globalThis.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(api.logout(), (e) => e.status === 0);
    assert.equal(api.getSession(), null, 'logout clears state even when network fails');
    api.saveSession(session, true);
    globalThis.fetch = async () => Response.json({ message: 'Expired' }, { status: 401 });
    await assert.rejects(api.me(), (e) => e.status === 401);
    assert.equal(api.getSession(), null);
    localStorage.setItem('nexus.auth.session', JSON.stringify({ ...session, expiresAt: '2000-01-01T00:00:00Z' }));
    assert.equal(api.getSession(), null);
    localStorage.setItem('nexus.auth.session', '{broken');
    assert.equal(api.getSession(), null);
    assert.throws(() => api.saveSession({ ...session, expiresAt: 'invalid' }, true));
    globalThis.fetch = async () => Response.json(wireSession());
    await assert.rejects(api.login({ identifier: 'testuser', password: input.password, role: 'seller' }, true), (e) => e.status === 403);
    assert.equal(api.getSession(), null);
    const controller = new AbortController(); controller.abort();
    await assert.rejects(api.login({ identifier: 'testuser', password: input.password, role: 'buyer' }, true, controller.signal), (e) => e.name === 'AbortError');
    assert.equal(api.getSession(), null);
    globalThis.fetch = async () => new Response('not json', { status: 502 });
    await assert.rejects(api.register(input), (e) => e.status === 502);
    globalThis.fetch = async () => ({ status: 200, ok: true, text: async () => { throw new TypeError('stream closed'); } });
    await assert.rejects(api.register(input), e => e instanceof api.AuthApiError && e.status === 0);
    // Stale authenticated failures must not sign out a newer session.
    const client = await server.ssrLoadModule('/src/services/api/client.ts');
    for (const invoke of [() => api.me(), () => client.api('/api/v1/buyer/cart')]) {
      api.saveSession(session, false);
      let respond;
      globalThis.fetch = () => new Promise(resolve => { respond = resolve; });
      const pending = invoke();
      const latest = { ...session, accessToken: 'newer-session' };
      api.saveSession(latest, true);
      respond(Response.json({ message: 'Expired' }, { status: 401 }));
      await assert.rejects(pending, error => error.status === 401);
      assert.equal(api.getSession().accessToken, latest.accessToken);
    }
    for (const cancel of ['logout', 'new-login']) {
      api.clearSession();
      let respond;
      globalThis.fetch = () => new Promise(resolve => { respond = resolve; });
      const pending = api.login({ identifier: 'test@example.com', password: input.password, role: 'buyer' }, false);
      const firstRespond = respond;
      let newer;
      if (cancel === 'logout') api.clearSession();
      else {
        newer = api.login({ identifier: 'test@example.com', password: input.password, role: 'buyer' }, false);
        respond(Response.json(wireSession()));
        await newer;
      }
      firstRespond(Response.json(wireSession()));
      await assert.rejects(pending, error => error.name === 'AbortError');
      if (cancel === 'logout') assert.equal(api.getSession(), null);
      else assert.equal(api.getSession().accessToken, session.accessToken);
    }
    globalThis.fetch = async () => Response.json({ ...wireSession(), expiresIn: Number.MAX_VALUE });
    await assert.rejects(api.login({ identifier: 'test@example.com', password: input.password, role: 'buyer' }, true), error => error instanceof api.AuthApiError);
    globalThis.fetch = async () => Response.json({});
    await assert.rejects(api.register(input), (e) => e.status === 0);
    await assert.rejects(api.login({ identifier: 'testuser', password: input.password, role: 'buyer' }, true));
  } finally {
    globalThis.fetch = originalFetch;
    if (oldLocal) Object.defineProperty(globalThis, 'localStorage', oldLocal); else delete globalThis.localStorage;
    if (oldSession) Object.defineProperty(globalThis, 'sessionStorage', oldSession); else delete globalThis.sessionStorage;
    await server.close();
  }
});
