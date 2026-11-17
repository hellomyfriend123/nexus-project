import { loadSellerInventory, mutateAuction } from '../../../services/api/seller';
import type { AuctionDraft, AuctionProduct } from '../types/createAuction';
import { buildAuctionRequest } from '../utils/auctionValidation';

export function createAuctionDraft(): AuctionDraft {
  return { productId: '', startingPrice: '', startDate: '', startTime: '', duration: '3', startNow: true };
}
/** Product IDs originate only in the authenticated seller's inventory, never a public catalog search. */
export async function getAuctionProducts(sellerId: string, signal?: AbortSignal): Promise<AuctionProduct[]> {
  const { inventories, products } = await loadSellerInventory(signal);
  return [...products.values()].filter(product => product.sellerId === sellerId).map(product => ({
    id: product.id, name: product.name, category: product.categoryName || 'Chưa có danh mục',
    sku: [...new Set(inventories.filter(row => row.productId === product.id).map(row => row.skuCode))].join(', '),
    image: product.primaryImageUrl || product.images[0] || '', images: product.images,
    description: product.description || '', price: Number(product.basePrice),
  }));
}
export async function createAuction(draft: AuctionDraft, products: AuctionProduct[], now = new Date()) {
  if (!products.some(product => product.id === draft.productId)) throw new Error('Vui lòng chọn sản phẩm từ kho của bạn.');
  return mutateAuction(null, buildAuctionRequest(draft, now));
}
