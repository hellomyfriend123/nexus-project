export const HOME_CAROUSEL_LIMIT = 20;
export const HOME_PRODUCT_LIMIT = HOME_CAROUSEL_LIMIT;
export const HOME_AUCTION_LIMIT = HOME_CAROUSEL_LIMIT;

export const homeContent = {
  hero: {
    eyebrow: 'KHÁM PHÁ CÙNG NEXUS',
    title: 'Món đồ bạn thích. Cách mua bạn chọn.',
    description: 'Khám phá sản phẩm mới, mua ngay với giá niêm yết hoặc tìm cơ hội trong những phiên đấu giá.',
    primaryAction: { label: 'Khám phá sản phẩm', to: '/products?mode=buy-now' },
    secondaryAction: { label: 'Xem phiên đấu giá', to: '/products?mode=auction' },
  },
  categories: { title: 'Bạn đang tìm gì?', description: 'Bắt đầu từ danh mục bạn quan tâm.', action: 'Khám phá tất cả' },
  products: { title: 'Sản phẩm mới đăng', description: 'Thêm lựa chọn mới cho những điều bạn thích.', action: 'Xem tất cả sản phẩm' },
  auctions: { title: 'Phiên đấu giá sắp kết thúc', description: 'Khám phá sản phẩm và theo dõi mức giá hiện tại.', action: 'Xem tất cả phiên' },
} as const;
