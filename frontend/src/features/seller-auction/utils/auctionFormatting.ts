import type { AuctionDraft } from '../types/createAuction';
import { auctionTimes } from './auctionValidation';
export const formatAuctionMoney = (value: number | string) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + ' ₫';
export function getAuctionEndDate(draft: AuctionDraft): string {
  const { end } = auctionTimes(draft);
  return Number.isNaN(end.getTime()) ? 'Vui lòng chọn ngày bắt đầu' : end.toLocaleString('vi-VN');
}
