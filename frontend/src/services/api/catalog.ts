import { api, ApiError, type PageResponse } from './client';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export interface CatalogProduct {
  id: string; name: string; basePrice: number; status: ProductStatus;
  sellerId: string; categoryId: string | null; categoryName: string | null;
  primaryImageUrl: string | null; createdAt: string;
}
export interface CatalogProductDetail extends CatalogProduct {
  description: string | null; images: string[]; updatedAt: string;
}
export interface CatalogCategory {
  id: string; name: string; description: string | null; parentId: string | null;
  status: 'ACTIVE' | 'INACTIVE'; sortOrder: number | null; children: CatalogCategory[];
}
export interface CatalogPage<T> {
  content: T[]; page: number; size: number; totalElements: number; totalPages: number;
}
export interface CatalogQuery {
  keyword?: string; categoryId?: string; minPrice?: number; maxPrice?: number;
  status?: ProductStatus; page?: number; size?: number;
  sort?: 'basePrice,asc' | 'basePrice,desc' | 'createdAt,asc' | 'createdAt,desc';
}
export function catalogQueryString(query: CatalogQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}
function invalid(): never { throw new ApiError(200, 'Dữ liệu catalog từ máy chủ không hợp lệ. Vui lòng thử lại.'); }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown): string { return typeof value === 'string' ? value : invalid(); }
function nullableText(value: unknown): string | null { return value == null ? null : text(value); }
function nonnegativeInteger(value: unknown): number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : invalid(); }
// Explicit adapters reject malformed wire data; never synthesize commercial metadata.
export function adaptProduct(value: unknown): CatalogProduct {
  const product = record(value);
  if (typeof product.basePrice !== 'number' || !Number.isFinite(product.basePrice) || product.basePrice < 0 || !['DRAFT', 'ACTIVE', 'INACTIVE'].includes(String(product.status))) return invalid();
  return {
    id: text(product.id), name: text(product.name), basePrice: product.basePrice, status: product.status as ProductStatus,
    sellerId: text(product.sellerId), categoryId: nullableText(product.categoryId), categoryName: nullableText(product.categoryName),
    primaryImageUrl: nullableText(product.primaryImageUrl), createdAt: text(product.createdAt)
  };
}
export function adaptProductDetail(value: unknown): CatalogProductDetail {
  const product = record(value);
  if (!Array.isArray(product.images)) return invalid();
  return { ...adaptProduct(product), description: nullableText(product.description), images: product.images.map(text), updatedAt: text(product.updatedAt) };
}
export function adaptCategory(value: unknown): CatalogCategory {
  const category = record(value);
  if (!Array.isArray(category.children) || !['ACTIVE', 'INACTIVE'].includes(String(category.status))) return invalid();
  return {
    id: text(category.id), name: text(category.name), description: nullableText(category.description), parentId: nullableText(category.parentId),
    status: category.status as CatalogCategory['status'], sortOrder: category.sortOrder == null ? null : nonnegativeInteger(category.sortOrder), children: category.children.map(adaptCategory)
  };
}
export function flattenCategories(tree: CatalogCategory[]): CatalogCategory[] {
  return tree.flatMap(category => [category, ...flattenCategories(category.children)]);
}
export function adaptProductPage(value: unknown): CatalogPage<CatalogProduct> {
  const page = record(value);
  if (!Array.isArray(page.content)) return invalid();
  return {
    content: page.content.map(adaptProduct), page: nonnegativeInteger(page.page), size: nonnegativeInteger(page.size),
    totalElements: nonnegativeInteger(page.totalElements), totalPages: nonnegativeInteger(page.totalPages)
  };
}
export async function listCatalogProducts(query: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage<CatalogProduct>> {
  return adaptProductPage(await api(`/api/v1/catalog/products?${catalogQueryString(query)}`, { signal }));
}
export async function getCatalogProduct(id: string, signal?: AbortSignal): Promise<CatalogProductDetail> {
  return adaptProductDetail(await api(`/api/v1/catalog/products/${encodeURIComponent(id)}`, { signal }));
}

/**
 * Image lookup for historical order/auction rows, which carry only `productId`.
 *
 * Order and auction DTOs have no image field, so the only source is the public catalog. Two
 * things keep that from turning into a request storm:
 *  - one in-flight/settled promise per productId, so N rows sharing a product make one call;
 *  - the promise is cached for PRODUCT_IMAGE_TTL_MS, so remounting a page does not refetch.
 *
 * The value is the CURRENT catalog image, not a snapshot taken at purchase time. A missing or
 * deleted product resolves to null rather than rejecting: a dead image must not break the row.
 */
const PRODUCT_IMAGE_TTL_MS = 5 * 60 * 1000;
const productImageCache = new Map<string, { at: number; value: Promise<string | null> }>();

export function resolveProductImage(productId: string): Promise<string | null> {
  const now = Date.now();
  const hit = productImageCache.get(productId);
  if (hit && now - hit.at < PRODUCT_IMAGE_TTL_MS) return hit.value;
  const value = getCatalogProduct(productId)
    .then(product => product.primaryImageUrl ?? product.images[0] ?? null)
    .catch(() => null);
  productImageCache.set(productId, { at: now, value });
  return value;
}

/** Drop cached lookups (session change, or a product edit that changed its cover image). */
export function clearProductImageCache(): void {
  productImageCache.clear();
}

/** Loads images for a page of rows at once, preserving order and never rejecting. */
export async function resolveProductImages(productIds: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(productIds.filter(Boolean))];
  const values = await Promise.all(unique.map(id => resolveProductImage(id)));
  return new Map(unique.map((id, index) => [id, values[index] ?? null]));
}
export async function getCatalogCategories(signal?: AbortSignal): Promise<CatalogCategory[]> {
  const tree = await api<unknown>('/api/v1/catalog/categories', { signal });
  if (!Array.isArray(tree)) return invalid();
  return tree.map(adaptCategory);
}

export interface Auction { id: string; productId: string; sellerId: string; startingPrice: number; currentPrice: number; startTime: string; endTime: string; status: string; highestBidderId: string | null; acceptedBidCount?: number }
export interface Listing extends CatalogProduct { auction?: Auction }
export interface Review { id: string; buyerId: string; score: number; comment: string | null; createdAt: string }
export interface Bid { id: string; bidderId: string; amount: number; placedAt: string }
function invalidContract(): never { throw new ApiError(200, 'Dữ liệu đấu giá hoặc đánh giá từ máy chủ không hợp lệ. Vui lòng thử lại.'); }
function object(value: unknown): Record<string, unknown> {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return invalidContract();
 return value as Record<string, unknown>;
}
function contractText(value: unknown): string { return typeof value === 'string' && value.length > 0 ? value : invalidContract(); }
function amount(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : invalidContract(); }
function integer(value: unknown): number { return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : invalidContract(); }
function timestamp(value: unknown): string { const result = contractText(value); return Number.isFinite(Date.parse(result)) ? result : invalidContract(); }
export function adaptAuction(value: unknown): Auction {
 const row = object(value);
 if (!['SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED'].includes(String(row.status))) return invalidContract();
 return { id: contractText(row.id), productId: contractText(row.productId), sellerId: contractText(row.sellerId), startingPrice: amount(row.startingPrice), currentPrice: amount(row.currentPrice), startTime: timestamp(row.startTime), endTime: timestamp(row.endTime), status: String(row.status), highestBidderId: row.highestBidderId == null ? null : contractText(row.highestBidderId), ...(row.acceptedBidCount == null ? {} : { acceptedBidCount: integer(row.acceptedBidCount) }) };
}
export function adaptBid(value: unknown): Bid {
 const row = object(value);
 if (row.status !== 'ACCEPTED') return invalidContract();
 return { id: contractText(row.id), bidderId: contractText(row.bidderId), amount: amount(row.amount), placedAt: timestamp(row.placedAt) };
}
export function adaptReview(value: unknown): Review {
 const row = object(value); const score = integer(row.score);
 if (score < 1 || score > 5 || (row.comment != null && typeof row.comment !== 'string')) return invalidContract();
 return { id: contractText(row.id), buyerId: contractText(row.buyerId), score, comment: row.comment == null ? null : String(row.comment), createdAt: timestamp(row.createdAt) };
}
export function adaptApiPage<T>(value: unknown, adapt: (item: unknown) => T): PageResponse<T> {
 const row = object(value);
 if (!Array.isArray(row.content) || typeof row.first !== 'boolean' || typeof row.last !== 'boolean') return invalidContract();
 return { content: row.content.map(adapt), page: integer(row.page), size: integer(row.size), totalElements: integer(row.totalElements), totalPages: integer(row.totalPages), first: row.first, last: row.last };
}
export async function listAuctionSummaries(query: URLSearchParams, signal?: AbortSignal): Promise<PageResponse<Auction>> {
 const keyword = query.get('keyword')?.trim();
 if (keyword && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(keyword)) {
   throw new ApiError(400, 'Tìm kiếm đấu giá theo tên chưa được hỗ trợ. Vui lòng nhập UUID sản phẩm hoặc người bán.');
 }
 return adaptApiPage(await api('/api/v1/auction/auctions?' + query, { signal }), adaptAuction);
}
export async function listAuctions(query: URLSearchParams, signal?: AbortSignal): Promise<PageResponse<Listing>> {
 const page = await listAuctionSummaries(query, signal);
 const content = await Promise.all(page.content.map(async auction => ({ ...await getCatalogProduct(auction.productId, signal), auction })));
 return { ...page, content };
}
export const getAuction = async (id: string, signal?: AbortSignal) => adaptAuction(await api('/api/v1/auction/auctions/' + encodeURIComponent(id), { signal }));
export const getBids = async (id: string, page = 0, signal?: AbortSignal) => adaptApiPage(await api('/api/v1/auction/auctions/' + encodeURIComponent(id) + '/bids?page=' + page + '&size=10', { signal }), adaptBid);
export const getReviews = async (id: string, page = 0, signal?: AbortSignal) => adaptApiPage(await api('/api/v1/catalog/products/' + encodeURIComponent(id) + '/reviews?page=' + page + '&size=10', { signal }), adaptReview);
export const placeBid = (id: string, amount: number) => api<unknown>('/api/v1/buyer/auction/auctions/' + encodeURIComponent(id) + '/bids', { method: 'POST', body: JSON.stringify({ amount }) }).then(adaptBid);

