import type { AdminMenuItem } from '../types/adminLayout.types';

export const adminMenuItems: AdminMenuItem[] = [
  { to: '/admin', end: true, label: 'Tổng quan', icon: 'bi-grid-1x2' },
  { to: '/admin/users', label: 'Người dùng', icon: 'bi-people' },
  { to: '/admin/catalog', label: 'Danh mục & sản phẩm', icon: 'bi-box-seam' },
  { to: '/admin/commerce', label: 'Đơn hàng & khuyến mãi', icon: 'bi-receipt' },
  { to: '/admin/fulfillment', label: 'Kho hàng & tồn kho', icon: 'bi-building' },
  { to: '/admin/auctions', label: 'Đấu giá', icon: 'bi-hammer' },
];
