import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

const product = id => ({ id, name: id, basePrice: 100, status: 'ACTIVE', sellerId: 'seller', categoryId: null, categoryName: null, primaryImageUrl: null, createdAt: '2026-11-01T00:00:00Z' });
const page = content => ({ content, page: 0, size: 10, totalPages: 3, totalElements: 30, first: true, last: false });

test('home loads a capped first set and skips only missing auction products', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const originalFetch = globalThis.fetch;
  try {
    const { loadHomeProducts } = await server.ssrLoadModule('/src/features/home/services/homeProducts.ts');
    const calls = [];
    let missingStatus = 404;
    globalThis.fetch = async url => {
      calls.push(url);
      if (url.includes('/auction/auctions?')) return Response.json(page(Array.from({ length: 12 }, (_, index) => ({ id: `auction-${index}`, productId: `item-${index}`, sellerId: 'seller', startingPrice: 100, currentPrice: 200, startTime: '2026-11-01T00:00:00Z', endTime: '2026-12-01T00:00:00Z', status: 'ACTIVE', highestBidderId: null }))));
      if (url.includes('/catalog/products?')) return Response.json(page(Array.from({ length: 12 }, (_, index) => product(`item-${index}`))));
      if (url.endsWith('/item-2')) return Response.json({ message: 'Unavailable' }, { status: missingStatus });
      return Response.json({ ...product(url.split('/').at(-1)), images: [], updatedAt: '2026-11-01T00:00:00Z' });
    };
    assert.equal((await loadHomeProducts(false)).length, 10);
    const auctions = await loadHomeProducts(true);
    assert.equal(auctions.length, 9);
    assert.ok(auctions.every(item => item.auction && item.id !== 'item-2'));
    assert.ok(calls.filter(url => url.includes('?')).every(url => url.includes('page=0') && url.includes('size=10')));
    assert.ok(!calls.some(url => url.endsWith('/item-10')));
    missingStatus = 500;
    await assert.rejects(loadHomeProducts(true), error => error.status === 500);
  } finally { globalThis.fetch = originalFetch; await server.close(); }
});
