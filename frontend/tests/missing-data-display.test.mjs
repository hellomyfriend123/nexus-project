import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url));
async function sourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(fullPath) : /\.tsx?$/.test(entry.name) ? [fullPath] : [];
  }));
  return groups.flat();
}

test('missing data uses N/A instead of an em dash without replacing sentence separators', async () => {
  for (const file of await sourceFiles(sourceRoot)) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /(['"])—(?: ₫)?\1|>—(?:<|\s*<small>)/, path.relative(sourceRoot, file));
  }
  for (const relativePath of [
    'features/admin/components/AdminCatalogTable.tsx',
    'features/auction-results/components/PaymentCountdown.tsx',
  ]) {
    assert.match(await readFile(path.join(sourceRoot, relativePath), 'utf8'), /N\/A/, relativePath);
  }
  const suggestions = await readFile(path.join(sourceRoot, 'shared/pages/notFoundSuggestions.ts'), 'utf8');
  assert.match(suggestions, /— cần quyền Admin/);
});

