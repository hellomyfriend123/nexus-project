import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('Register validation and initial UI', async () => {
  const server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  try {
    const { validateRegister } = await server.ssrLoadModule(
      '/src/features/auth/services/register.validation.ts',
    );
    const valid = {
      username: 'nguyen.minh',
      phone: '',
      fullName: 'Nguyễn Minh',
      email: 'minh@example.com',
      password: 'DemoPass123',
      confirmPassword: 'DemoPass123',
      role: 'buyer',
    };
    assert.deepEqual(validateRegister(valid), {});
    assert.deepEqual(validateRegister({ ...valid, role: 'seller' }), {});
    assert.deepEqual(
      validateRegister({ ...valid, email: ' minh@example.com ' }),
      {},
    );
    const empty = validateRegister({
      ...valid,
      fullName: ' ',
      email: '',
      password: '',
      confirmPassword: '',
    });
    assert.equal(Object.keys(empty).length, 4);
    assert.ok(validateRegister({ ...valid, email: 'invalid' }).email);
    assert.ok(validateRegister({ ...valid, password: 'short' }).password);
    assert.ok(validateRegister({ ...valid, username: 'ab' }).username);
    assert.ok(validateRegister({ ...valid, username: 'a'.repeat(101) }).username);
    assert.ok(validateRegister({ ...valid, fullName: 'a'.repeat(151) }).fullName);
    assert.ok(validateRegister({ ...valid, email: 'a'.repeat(256) }).email);
    assert.ok(validateRegister({ ...valid, phone: 'not-phone' }).phone);
    assert.deepEqual(validateRegister({ ...valid, phone: '+84901234567' }), {});
    assert.ok(validateRegister({ ...valid, password: 'a'.repeat(129) }).password);
    assert.deepEqual(validateRegister({ ...valid, password: '123456', confirmPassword: '123456' }), {});
    assert.ok(
      validateRegister({ ...valid, confirmPassword: 'different' })
        .confirmPassword,
    );
    assert.equal(
      validateRegister({
        ...valid,
        password: '12345678',
        confirmPassword: '12345678',
      }).password,
      undefined,
    );

    const { default: RegisterPage } = await server.ssrLoadModule(
      '/src/features/auth/pages/RegisterPage.tsx',
    );
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(RegisterPage)),
    );
    assert.match(html, /id="register-title"/);
    assert.match(html, /id="register-phone"[^>]*type="tel"/);
    assert.doesNotMatch(html.match(/<input id="register-phone"[^>]*>/)[0], /required/);
    assert.match(html, /minLength="6"/);
    assert.doesNotMatch(html, /mô phỏng|Chưa kết nối Backend/);
    assert.match(html, /maxLength="128"/);
    assert.ok(html.includes('class="u062-register-btn">Đăng nhập</button>'));
    assert.equal((html.match(/type="password"/g) || []).length, 2);
    for (const field of ['username', 'phone', 'fullName', 'email', 'password', 'confirmPassword']) {
      assert.ok(html.includes(`id="register-${field}"`));
      assert.ok(html.includes(`for="register-${field}"`));
    }
    const { default: LoginPage } = await server.ssrLoadModule(
      '/src/features/auth/pages/LoginPage.tsx',
    );
    const login = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(LoginPage)),
    );
    assert.ok(login.includes('class="u062-register-btn">Đăng ký</button>'));
    for (const markup of [html, login]) {
      assert.match(markup, /aria-label="NEXUS — tạo sóng chữ"/);
      assert.equal((markup.match(/class="u205-l"/g) || []).length, 5);
    }
  } finally {
    await server.close();
  }
});
