import { api, ApiError } from './client';
export interface AuctionSettlement { id: string; auctionId: string; winnerId: string | null; orderId: string | null; finalPrice: number | null; status: 'WON' | 'FAILED' | 'NO_BIDS'; settledAt: string; bidCount: number }
export function adaptSettlement(value: unknown): AuctionSettlement {
  const row = value as Partial<AuctionSettlement> | null;
  const text = (v: unknown) => typeof v === 'string' && v.length > 0;
  if (!row || !text(row.id) || !text(row.auctionId) || !text(row.settledAt) || !Number.isFinite(Date.parse(row.settledAt!)) || !['WON', 'FAILED', 'NO_BIDS'].includes(String(row.status)) || !Number.isSafeInteger(row.bidCount) || row.bidCount! < 0 || (row.winnerId != null && !text(row.winnerId)) || (row.orderId != null && !text(row.orderId)) || (row.finalPrice != null && (typeof row.finalPrice !== 'number' || !Number.isFinite(row.finalPrice) || row.finalPrice < 0)) || (row.status === 'WON' && (!row.winnerId || row.finalPrice == null))) throw new ApiError(200, 'Dữ liệu kết quả đấu giá không hợp lệ.');
  return row as AuctionSettlement;
}
export const getAuctionSettlement = async (id: string, signal?: AbortSignal) => adaptSettlement(await api('/api/v1/auction/auctions/' + encodeURIComponent(id) + '/settlement', { signal }));
