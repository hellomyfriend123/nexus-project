import type { AccountMenuItem } from '../../../shared/components/AccountLayout';

/**
 * Seller account navigation.
 *
 * "Đổi mật khẩu" is listed on purpose even though the backend has no change-password endpoint
 * (AuthService exposes only register/login/logout/getCurrentUser/exchangeOAuth2Code). The
 * section renders an honest unsupported notice — see docs/api-gaps.md.
 *
 * The three hub entries share /seller-hub and differ by ?tab=, which isMenuItemActive matches
 * on so exactly one of them is highlighted.
 */
export const sellerAccountMenu: AccountMenuItem[] = [
  { to: '/seller/profile', label: 'Hồ sơ cá nhân', icon: 'person' },
  { to: '/seller/address', label: 'Địa chỉ', icon: 'geo-alt' },
  { to: '/seller/password', label: 'Đổi mật khẩu', icon: 'shield-lock' },
  { to: '/seller-hub?tab=products', label: 'Sản phẩm & tồn kho', icon: 'box-seam' },
  { to: '/seller-hub?tab=orders', label: 'Đơn bán', icon: 'receipt' },
  { to: '/seller-hub?tab=auctions', label: 'Phiên đấu giá', icon: 'hammer' },
];
