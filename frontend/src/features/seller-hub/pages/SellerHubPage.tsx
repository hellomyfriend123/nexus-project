import SellerOverview from '../components/SellerOverview';
import QuickListing from '../components/QuickListing';
import ProductInventory from '../components/ProductInventory';
import SellerSidebar from '../components/SellerSidebar';
import AuctionsTab from '../components/AuctionsTab';
import OrdersTab from '../components/OrdersTab';
import ReportsTab from '../components/ReportsTab';
import { useSellerHub } from '../hooks/useSellerHub';

// TODO(seller-hub): toàn bộ tab dùng mock data; chưa gọi REST API nào.
export default function SellerHubPage() {
  const hub = useSellerHub();
  return <main className="nx-seller-page"><div className="nx-container">{hub.loading && <p role="status">Đang tải dữ liệu bán hàng…</p>}{hub.error && <p role="alert">{hub.error}</p>}
    <SellerOverview activeTab={hub.activeTab} onTabChange={hub.setActiveTab} onCreateProduct={hub.focusListing} onAction={hub.mockAction} />
    {hub.activeTab === 'products' && <div className="nx-seller-content"><div className="nx-seller-main"><QuickListing hub={hub} /><ProductInventory hub={hub} /></div><SellerSidebar onAction={hub.mockAction} /></div>}
    {hub.activeTab === 'auctions' && <div className="nx-seller-content"><div className="nx-seller-main"><AuctionsTab hub={hub} /></div><SellerSidebar onAction={hub.mockAction} /></div>}
    {hub.activeTab === 'orders' && <div className="nx-seller-content"><div className="nx-seller-main"><OrdersTab hub={hub} /></div><SellerSidebar onAction={hub.mockAction} /></div>}
    {hub.activeTab === 'reports' && <div className="nx-seller-main nx-seller-main--full"><ReportsTab hub={hub} /></div>}
  </div></main>;
}
