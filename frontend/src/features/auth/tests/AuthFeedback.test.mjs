import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('Auth feedback keeps correctable errors inline and system failures in toasts', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { getAuthErrorFeedback: feedback } = await server.ssrLoadModule('/src/features/auth/services/auth.feedback.ts');
    const { AuthApiError } = await server.ssrLoadModule('/src/features/auth/services/auth.api.ts');
    const credentials = feedback(new AuthApiError(401, 'private server detail'), 'login');
    assert.deepEqual(credentials, { kind: 'credentials', message: 'Tài khoản hoặc mật khẩu không đúng.' });
    for (const context of ['login', 'register']) {
      for (const status of [400, 403, 409, 422, 499]) {
        assert.deepEqual(feedback(new AuthApiError(status, 'Correct this input'), context), { kind: 'notice', message: 'Correct this input' });
      }
      assert.deepEqual(feedback(new AuthApiError(0, 'Connection unavailable'), context), { kind: 'toast', message: 'Connection unavailable' });
      for (const status of [500, 502, 503]) {
        const result = feedback(new AuthApiError(status, 'private server detail', [{ field: 'email', message: 'ignored' }]), context);
        assert.equal(result.kind, 'toast');
        assert.notEqual(result.message, 'private server detail');
      }
      for (const unexpected of [new Error('private failure'), null, 'private failure']) {
        const result = feedback(unexpected, context);
        assert.equal(result.kind, 'toast');
        assert.doesNotMatch(result.message, /private/);
      }
    }
    assert.deepEqual(feedback(new AuthApiError(422, 'Do not duplicate', [
      { field: 'email', message: 'Email đã được sử dụng.' },
      { field: 'username', message: 'Chọn tên khác.' },
      { field: 'unknown', message: 'Ignore' },
      { field: '__proto__', message: 'Ignore' },
      { field: 'password', message: '' },
      null,
    ]), 'register'), { kind: 'fields', errors: { email: 'Email đã được sử dụng.', username: 'Chọn tên khác.' } });
    assert.deepEqual(feedback(new AuthApiError(400, 'Form error', [{ field: 'unknown', message: 'Ignore' }]), 'register'), { kind: 'notice', message: 'Form error' });
    assert.equal(feedback(new AuthApiError(401, 'Register rejected'), 'register').kind, 'notice');
    // Login has no field-detail mapping: do not expose account lookup details on a 401.
    assert.deepEqual(feedback(new AuthApiError(401, 'Ignored', [{ field: 'identifier', message: 'Account exists' }]), 'login'), credentials);
  } finally {
    await server.close();
  }
});
