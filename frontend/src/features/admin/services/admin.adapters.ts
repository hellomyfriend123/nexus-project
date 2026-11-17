import type { PageResponse } from '../../../services/api/client';
import type { ReviewResponse, AuctionResponse, InventoryResponse } from '../types/admin.contracts';
import type { AdminReview, AdminAuction, AdminInventoryItem } from '../types/admin.types';
export function mapPage<A, B>(page: PageResponse<A>, map: (row: A) => B): PageResponse<B> { return { ...page, content: page.content.map(map) }; }
export function reviewView(row: ReviewResponse): AdminReview { return { ...row, productName: row.productId, userId: row.buyerId, userFullName: row.buyerId, rating: row.score }; }
export function auctionView(row: AuctionResponse): AdminAuction { return { ...row, title: row.productId, productName: row.productId, sellerName: row.sellerId, currentBid: row.currentPrice, totalBids: row.bidCount, bids: row.bids.map(bid => ({ ...bid, bidderName: bid.bidderId, bidderEmail: '', bidTime: bid.placedAt, isWinningBid: row.highestBidderId === bid.bidderId })) }; }
export function inventoryView(row: InventoryResponse): AdminInventoryItem { return { ...row, sku: row.skuCode, productName: row.skuName, warehouseName: row.warehouseId, quantityOnHand: row.totalQuantity, quantityAvailable: row.availableQuantity, quantityReserved: row.totalQuantity - row.availableQuantity }; }
