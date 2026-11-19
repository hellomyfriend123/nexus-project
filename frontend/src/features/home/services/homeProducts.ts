import { getCatalogProduct, listAuctionSummaries, listCatalogProducts, type Listing } from '../../../services/api/catalog';
import { ApiError } from '../../../services/api/client';
import { HOME_PRODUCT_LIMIT, HOME_AUCTION_LIMIT } from '../constants/homeContent';

/** Fetch one bounded set. Carousel navigation never requests additional pages. */
export async function loadHomeProducts(auction: boolean, signal?: AbortSignal): Promise<Listing[]> {
  if (!auction) {
    const result = await listCatalogProducts({ status: 'ACTIVE', size: HOME_PRODUCT_LIMIT, page: 0, sort: 'createdAt,desc' }, signal);
    return result.content.slice(0, HOME_PRODUCT_LIMIT);
  }
  const result = await listAuctionSummaries(new URLSearchParams({ status: 'ACTIVE', page: '0', size: String(HOME_AUCTION_LIMIT), sort: 'endTime,asc' }), signal);
  const listings = await Promise.all(result.content.slice(0, HOME_AUCTION_LIMIT).map(async auction => {
    try { return { ...await getCatalogProduct(auction.productId, signal), auction }; }
    catch (error) {
      // A deleted product must not hide other valid auctions. Preserve all other failures.
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }));
  return listings.filter(item => item !== null);
}
