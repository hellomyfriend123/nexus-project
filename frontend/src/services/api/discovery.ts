import { getSession } from './auth';
import { ApiError } from './client';
import { listAuctions, listCatalogProducts, type CatalogQuery, type CatalogPage, type Listing } from './catalog';

export const AUCTION_REFRESH_MS = 15000;
export interface DiscoveryQuery extends CatalogQuery { mode: 'all' | 'auction' | 'buy-now' }

/** Each view follows one server-paginated resource. Legacy all links resolve to the catalog. */
export async function listDiscoveryProducts(query: DiscoveryQuery, signal?: AbortSignal): Promise<CatalogPage<Listing>> {
  const { mode, ...catalogQuery } = query;
  if (mode !== 'auction') return listCatalogProducts(catalogQuery, signal);
  if (!getSession()) throw new ApiError(401, 'Đăng nhập để xem các phiên đấu giá.');
  const params = new URLSearchParams({ status: 'ACTIVE', page: String(query.page ?? 0), size: String(query.size ?? 24), sort: 'endTime,asc' });
  return listAuctions(params, signal);
}
