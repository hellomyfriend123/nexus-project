import type { AdminMenuItem } from '../types/adminLayout.types';
// Static navigation configuration, not backend business data.
export const adminMenuItems: AdminMenuItem[] = [
    {
      to: '/admin',
      end: true,
      label: 'Tổng quan (Dashboard)',
      icon: 'bi-grid-1x2-fill',
    },
    {
      to: '/admin/users',
      label: 'Quản lý người dùng',
      icon: 'bi-people-fill',
      badge: 'FR-04',
    },
    {
      to: '/admin/catalog',
      label: 'Danh mục & Sản phẩm',
      icon: 'bi-box-seam-fill',
      badge: 'Catalog',
    },
    {
      to: '/admin/commerce',
      label: 'Đơn hàng & Khuyến mãi',
      icon: 'bi-receipt-cutoff',
      badge: 'Commerce',
    },
    {
      to: '/admin/fulfillment',
      label: 'Tồn kho & Kho hàng',
      icon: 'bi-building-fill-gear',
      badge: 'Fulfillment',
    },
    {
      to: '/admin/auctions',
      label: 'Quản lý đấu giá',
      icon: 'bi-hammer',
      badge: 'Auction',
    },
  ];
