import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SellerHubHeading from '../components/SellerHubHeading';
import SellerSidebar from '../components/SellerSidebar';
import AuctionsTab from '../components/AuctionsTab';
import OrdersTab from '../components/OrdersTab';
import CreateAuctionDialog from '../../seller-auction/components/CreateAuctionDialog';
import { useSellerHub } from '../hooks/useSellerHub';

export interface SellerHubPageProps {
  /**
   * When true the page renders only the workspace and delegates "Tạo phiên đấu giá" to
   * onCreateAuction. The legacy /seller/auctions/new route uses this so it can own a single
   * dialog instance instead of nesting a second one inside this page's own.
   */
  controlled?: boolean;
  onCreateAuction?: () => void;
}

/**
 * Seller workspace.
 *
 * The old in-page tab strip was removed: the account sidebar is now the single navigation for
 * these sections, and keeping both would leave two controls doing the same job. `?tab=` still
 * drives which section renders, and the sidebar links to it.
 */
export default function SellerHubPage({ controlled = false, onCreateAuction }: SellerHubPageProps) {
  const hub = useSellerHub();
  const navigate = useNavigate();
  // Opened in place so the list keeps its filter.
  const [creating, setCreating] = useState(false);
  const openCreate = () => (controlled ? onCreateAuction?.() : setCreating(true));
  return <main className="nx-seller-page"><div className="nx-container">
    <SellerHubHeading activeTab={hub.activeTab} />
    {hub.loading && <p role="status">Đang tải dữ liệu bán hàng…</p>}
    {hub.error && <p role="alert" className="nx-seller-alert">{hub.error}</p>}
    {hub.activeTab === 'products' && <div className="nx-seller-content" role="tabpanel" id="hub-panel-products" aria-labelledby="hub-tab-products">
      <section className="nx-seller-card nx-seller-home-card"><div className="nx-seller-section-heading"><div><h2>Sản phẩm & tồn kho</h2><p>Quản lý sản phẩm, điều chỉnh số lượng và tạo phiên đấu giá.</p></div></div>
        {!hub.loading && !hub.error && <div className="nx-seller-summary"><div><strong>{hub.inventoryCount}</strong><span>SKU có tồn kho</span></div><div><strong>{hub.lowStockCount}</strong><span>SKU sắp hết hàng</span></div><div><strong>{hub.pendingOrders}</strong><span>Đơn chờ xác nhận</span></div></div>}
        <div className="nx-seller-home-actions"><Link className="nx-seller-button" to="/seller/products">Quản lý kho hàng</Link><Link className="nx-seller-secondary" to="/seller/products/new">Thêm sản phẩm</Link></div>
      </section><SellerSidebar /></div>}
    {hub.activeTab === 'auctions' && <AuctionsTab hub={hub} onCreate={openCreate} />}
    {hub.activeTab === 'orders' && <OrdersTab hub={hub} />}
    {!controlled && <CreateAuctionDialog
      open={creating}
      onClose={() => setCreating(false)}
      onCreated={auction => {
        setCreating(false);
        // Send the seller to the result page so the new auction is confirmed explicitly.
        navigate(`/seller/auctions/${encodeURIComponent(auction.id)}/result`);
      }}
    />}
  </div></main>;
}
