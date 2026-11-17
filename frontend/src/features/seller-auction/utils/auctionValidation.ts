import type { AuctionDraft, CreateAuctionRequest } from '../types/createAuction';
export function auctionTimes(draft: AuctionDraft, now = new Date()) {
  const start = draft.startNow ? new Date(now) : new Date(`${draft.startDate}T${draft.startTime}`);
  const end = new Date(start.getTime() + Number(draft.duration) * 86400000);
  return { start, end };
}
export function validateAuction(draft: AuctionDraft, now = new Date()): string[] {
  const errors: string[] = [];
  if (!draft.productId) errors.push('Vui lòng chọn sản phẩm đấu giá.');
  const price = Number(draft.startingPrice);
  if (!Number.isFinite(price) || price <= 0) errors.push('Giá khởi điểm phải là số hữu hạn lớn hơn 0.');
  const { start, end } = auctionTimes(draft, now);
  if (!Number.isFinite(start.getTime())) errors.push('Vui lòng chọn ngày và giờ bắt đầu hợp lệ.');
  else if (!draft.startNow && start.getTime() <= now.getTime()) errors.push('Thời gian bắt đầu phải ở tương lai.');
  if (!Number.isFinite(end.getTime()) || end <= start || !Number.isInteger(Number(draft.duration))) errors.push('Thời lượng đấu giá phải là số ngày nguyên lớn hơn 0.');
  return errors;
}
export function buildAuctionRequest(draft: AuctionDraft, now = new Date()): CreateAuctionRequest {
  const errors = validateAuction(draft, now);
  if (errors.length) throw new Error(errors.join(' '));
  const { start, end } = auctionTimes(draft, now);
  return { productId: draft.productId, startingPrice: Number(draft.startingPrice), startTime: start.toISOString(), endTime: end.toISOString() };
}
