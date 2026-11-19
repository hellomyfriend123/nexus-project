import type { SellerTabId } from '../types/sellerHub';

const sectionCopy: Record<SellerTabId, { title: string; description: string }> = {
  products: { title: 'Sản phẩm & tồn kho', description: 'Theo dõi đơn hàng và quản lý hoạt động bán hàng của bạn.' },
  orders: { title: 'Đơn bán', description: 'Xác nhận, đóng gói và theo dõi đơn hàng của người mua.' },
  auctions: { title: 'Phiên đấu giá', description: 'Theo dõi giá, lượt trả giá và kết quả các phiên của bạn.' },
  reports: { title: 'Báo cáo', description: 'Số liệu bán hàng của bạn.' },
};

/**
 * Page heading for the seller workspace.
 *
 * The tab strip this component used to render was removed: the account sidebar is now the only
 * navigation between these sections, so keeping a second control with the same purpose would
 * contradict the account-workspace spec. The heading still reflects the active section.
 */
export default function SellerHubHeading({ activeTab }: { activeTab: SellerTabId }) {
  const copy = sectionCopy[activeTab] ?? sectionCopy.products;
  return <header className="nx-seller-heading"><div className="nx-seller-heading-copy"><h1>Kênh người bán</h1><p>{copy.description}</p></div></header>;
}
