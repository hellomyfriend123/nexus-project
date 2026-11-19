import type { AccountMenuItem } from '../../../shared/components/AccountLayout';

/**
 * Buyer account navigation.
 *
 * "Đấu giá đã tham gia" is listed on purpose even though the backend has no endpoint to list a
 * bidder's bids (BidRepository has no bidderId query). The section renders an honest
 * unsupported notice instead of a fake list — see docs/api-gaps.md.
 */
export const buyerAccountMenu: AccountMenuItem[] = [
  { to: '/buyer/profile', label: 'Hồ sơ cá nhân', icon: 'person' },
  { to: '/buyer/address', label: 'Địa chỉ nhận hàng', icon: 'geo-alt' },
  { to: '/buyer/password', label: 'Đổi mật khẩu', icon: 'shield-lock' },
  { to: '/buyer-hub', label: 'Đơn mua', icon: 'bag-check', end: true },
  { to: '/buyer/auctions', label: 'Đấu giá đã tham gia', icon: 'hammer' },
];
