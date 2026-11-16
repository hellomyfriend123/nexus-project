import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('Sign-in animation CSS retains scoped busy/success geometry and timing', async () => {
  const css = await readFile(
    new URL('../styles/sign-in-card.css', import.meta.url),
    'utf8',
  );
  const buttons = await readFile(
    new URL('../../../shared/styles/btn.css', import.meta.url),
    'utf8',
  );
  const combined = css + buttons;
  assert.match(
    combined,
    /\.u062 \.u062-go\.busy,\s*\.u062 \.u062-go\.ok\s*\{\s*width: 54px;\s*border-radius: 27px;/,
  );
  assert.match(
    combined,
    /\.u062 \.u062-go\.busy span,\s*\.u062 \.u062-go\.ok span\s*\{\s*opacity: 0;/,
  );
  assert.match(combined, /width 0\.45s var\(--ux-spring\)/);
  assert.match(combined, /animation: u062-spin 0\.7s linear infinite/);
  assert.match(
    combined,
    /animation: u062-no 0\.5s cubic-bezier\(0\.36, 0\.07, 0\.19, 0\.97\)/,
  );
  assert.match(combined, /stroke-dashoffset 0\.4s var\(--ux-ease\) 0\.1s/);
  assert.match(combined, /visibility 0s 0\.6s/);
  assert.match(combined, /prefers-reduced-motion: reduce/);
  assert.match(combined, /transition-delay: 0ms !important/);
});

test('Auth password fields suppress the native duplicate reveal button', async () => {
  const css = await readFile(new URL('../styles/sign-in-card.css', import.meta.url), 'utf8');
  assert.match(css, /\.u062 \.u062-box input::-ms-reveal\s*\{\s*display: none;/);
});