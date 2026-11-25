import type { AuctionFilterId, BuyerKpi, C2cOption, FilterChipOption, GuaranteeItem, HubTab, OrderFilterId } from '../types/buyerHub';

// UI labels and empty-state configuration; business data comes from the API.
export const auctionFilters: FilterChipOption<AuctionFilterId>[] = [
  { id: 'all', label: 'Tất cả', count: 0 },
  { id: 'leading', label: 'Đang dẫn đầu', count: 0 },
  { id: 'outbid', label: 'Bị vượt giá', count: 0 },
  { id: 'won', label: 'Thắng thầu', count: 0 },
];

export const buyerKpis: BuyerKpi[] = [
  {
    id: 'shipping',
    label: 'Đơn hàng đang giao',
    value: '—',
    unit: 'đơn',
    icon: 'bi-truck',
    iconTone: 'primary',
    valueTone: 'default',
    pillTone: 'primary',
  },
  {
    id: 'active-bids',
    label: 'Đang theo đuổi (Active Bids)',
    value: '—',
    unit: 'phiên',
    icon: 'bi-stopwatch',
    iconTone: 'secondary',
    valueTone: 'default',
    pillTone: 'secondary',
  },
  {
    id: 'won-pending',
    label: 'Thắng chờ thanh toán',
    value: '—',
    unit: 'phiên',
    icon: 'bi-trophy-fill',
    iconTone: 'highlight',
    valueTone: 'secondary',
    emphasis: true,
  },
  {
    id: 'saved-cart',
    label: 'Sản phẩm yêu thích & Giỏ',
    value: '—',
    unit: 'mục',
    icon: 'bi-bookmark',
    iconTone: 'accent',
    valueTone: 'default',
  },
];

export const c2cCategories: C2cOption[] = [];
export const c2cDurations: C2cOption[] = [];

export const guaranteeItems: GuaranteeItem[] = [];

export const hubCopy = {
  auctionFilterLabel: 'Lọc theo trạng thái:',
  auctionSearchPlaceholder: 'Tìm tên phiên...',
  ordersSummary: 'Đơn hàng từ hệ thống',
  savedCartTitle: 'Sản phẩm Đã lưu & Giỏ hàng cá nhân',
  savedCartSummary: 'Backend chưa hỗ trợ lưu sau',
  savedCartSelectAll: 'Chọn tất cả để thanh toán',
  c2cTitle: 'Phiên đấu giá do bạn tự mở (C2C Personal Auctions)',
  c2cSubtitle:
    'Dành cho người dùng cá nhân muốn thanh lý hoặc bán đấu giá đồ cũ/đồ sưu tầm an toàn với cơ chế ký quỹ.',
  c2cActiveLabel: 'Đang mở thầu sôi động',
  c2cFormTitle: 'Tạo phiên đấu giá C2C mới nhanh chóng',
  liveFeedTitle: 'Thông báo phiên trực tiếp',
  guaranteeTitle: 'Nexus Guarantee',
  guaranteeSubtitle: 'Bảo vệ Người Mua Toàn Diện',
  guaranteeLink: 'Đọc điều khoản bảo vệ người mua',
  supportTitle: 'Cần trợ giúp giải quyết tranh chấp?',
  supportBody:
    'Các kênh hỗ trợ chưa được tích hợp.',
};

export const hubTabs: HubTab[] = [
  { id: 'auctions', label: 'Đấu Giá Của Tôi', icon: 'bi-hammer', count: 0 },
  { id: 'orders', label: 'Quản Lý Đơn Hàng', icon: 'bi-box-seam', count: 0 },
  { id: 'cart', label: 'Đã lưu', icon: 'bi-heart', count: 0 },
  {
    id: 'c2c',
    label: 'Phiên Tôi Tự Mở (C2C)',
    icon: 'bi-megaphone',
    count: 0,
    countTone: 'alert',
  },
];

export const orderFilters: FilterChipOption<OrderFilterId>[] = [
  { id: 'all', label: 'Tất cả', count: 0 },
  { id: 'shipping', label: 'Đang giao', count: 0 },
  { id: 'completed', label: 'Hoàn thành', count: 0 },
  { id: 'cancelled', label: 'Đã hủy', count: 0 },
];
