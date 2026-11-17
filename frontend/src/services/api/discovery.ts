import { getSession } from './auth';
import { ApiError } from './client';
import { getCatalogProduct, listAuctionSummaries, listCatalogProducts, type Auction, type CatalogQuery, type CatalogPage, type Listing } from './catalog';

export const AUCTION_REFRESH_MS = 15000;
export interface DiscoveryQuery extends CatalogQuery {
  mode: 'all' | 'auction' | 'buy-now';
}

/** Only documented auction filters go to the server. Category/price are applied after
 * reading every auction page, so counts and pagination describe the filtered set. */
async function activeAuctions(signal?: AbortSignal, keyword = ''): Promise<Auction[]> {
  const rows: Auction[] = [];
  for (let page = 0; ; page++) {
    const result = await listAuctionSummaries(new URLSearchParams({ status: 'ACTIVE', keyword, page: String(page), size: '100', sort: 'endTime,asc' }), signal);
    if (result.page !== page) throw new ApiError(200, 'Phân trang đấu giá không hợp lệ.');
    rows.push(...result.content);
    if (result.last || page + 1 >= result.totalPages) return rows;
  }
}

export async function listDiscoveryProducts(query: DiscoveryQuery, signal?: AbortSignal): Promise<CatalogPage<Listing>> {
  const { mode, ...catalogQuery } = query;
  if (mode === 'auction') {
    if (!getSession()) throw new ApiError(401, 'Đăng nhập để xem các phiên đấu giá.');
    const auctions = await activeAuctions(signal, query.keyword?.trim());
    let content: Listing[] = await Promise.all(auctions.map(async auction => ({ ...await getCatalogProduct(auction.productId, signal), auction })));
    content = content.filter(product => (!query.status || product.status === query.status) && (!query.categoryId || product.categoryId === query.categoryId)
      && (query.minPrice === undefined || product.auction!.currentPrice >= query.minPrice)
      && (query.maxPrice === undefined || product.auction!.currentPrice <= query.maxPrice));
    if (query.sort?.startsWith('basePrice,')) {
      const direction = query.sort.endsWith('asc') ? 1 : -1;
      content.sort((a, b) => direction * (a.auction!.currentPrice - b.auction!.currentPrice));
    }
    const page = query.page ?? 0; const size = query.size ?? 24;
    return { content: content.slice(page * size, (page + 1) * size), page, size, totalElements: content.length, totalPages: Math.ceil(content.length / size) };
  }
  if (mode === 'buy-now' || !getSession()) return listCatalogProducts(catalogQuery, signal);
  // Mixed cards display current auction price, so price filters/sort and pagination
  // must be applied after enrichment rather than to the catalog's base price.
  const products: Listing[] = [];
  for (let page = 0; ; page++) {
    const result = await listCatalogProducts({ ...catalogQuery, minPrice: undefined, maxPrice: undefined, page, size: 100 }, signal);
    if (result.page !== page) throw new ApiError(200, 'Phân trang sản phẩm không hợp lệ.');
    products.push(...result.content);
    if (page + 1 >= result.totalPages) break;
  }
  const auctions = products.length ? await activeAuctions(signal) : [];
  const byProduct = new Map<string, Auction>(auctions.map(auction => [auction.productId, auction]));
  const price = (product: Listing) => product.auction?.currentPrice ?? product.basePrice;
  let content = products.map(product => {
    const auction = byProduct.get(product.id);
    return auction ? { ...product, auction } : product;
  }).filter(product => (query.minPrice === undefined || price(product) >= query.minPrice)
    && (query.maxPrice === undefined || price(product) <= query.maxPrice));
  if (query.sort?.startsWith('basePrice,')) {
    const direction = query.sort.endsWith('asc') ? 1 : -1;
    content = content.sort((a, b) => direction * (price(a) - price(b)));
  }
  const page = query.page ?? 0; const size = query.size ?? 24;
  return { content: content.slice(page * size, (page + 1) * size), page, size, totalElements: content.length, totalPages: Math.ceil(content.length / size) };
}
