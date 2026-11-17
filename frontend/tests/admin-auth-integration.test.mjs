import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

test('admin login uses backend role without altering buyer/seller registration', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const oldFetch = globalThis.fetch;
  const descriptors = ['localStorage', 'sessionStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  for (const [key] of descriptors) {
    const values = new Map();
    Object.defineProperty(globalThis, key, { configurable: true, value: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } });
  }
  try {
    const auth = await server.ssrLoadModule('/src/services/api/auth.ts');
    let roles = ['ADMIN'];
    let request;
    globalThis.fetch = async (url, options) => {
      request = { url, body: JSON.parse(options.body) };
      return Response.json({ accessToken: 'test-token', tokenType: 'Bearer', expiresIn: 60, user: { id: 'test-id', fullName: 'Admin Test', email: 'admin@example.test', roles, status: 'ACTIVE' } });
    };
    const session = await auth.login({ identifier: 'admin@example.test', password: 'test-only', role: 'buyer' }, false);
    assert.deepEqual(session.roles, ['ADMIN']);
    assert.deepEqual(request.body, { email: 'admin@example.test', password: 'test-only' });
    assert.deepEqual(auth.getSession().roles, ['ADMIN']);
    auth.clearSession();
    roles = ['SELLER'];
    await assert.rejects(auth.login({ identifier: 'seller@example.test', password: 'test-only', role: 'buyer' }, false), error => error.status === 403);
    assert.equal(auth.getSession(), null);
    const types = readFileSync('src/services/api/auth.types.ts', 'utf8');
    assert.match(types, /AuthRole = 'buyer' \| 'seller'/);
    const guard = readFileSync('src/roles/administrator/layouts/AdminGuard.tsx', 'utf8');
    assert.match(guard, /roles.includes\('ADMIN'\)/);
    assert.doesNotMatch(guard, /loginAsMockAdmin|saveSession/);
    const hook = readFileSync('src/features/auth/hooks/useSignIn.ts', 'utf8');
    assert.ok(hook.includes("session.roles.includes('ADMIN') ? '/admin'"));
  } finally {
    globalThis.fetch = oldFetch;
    for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
    await server.close();
  }
});
