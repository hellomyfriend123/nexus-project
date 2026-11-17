import { useLocation } from 'react-router-dom';
import InventoryOverview from '../components/InventoryOverview';
import InventoryFilters from '../components/InventoryFilters';
import InventoryTable from '../components/InventoryTable';
import InventoryTips from '../components/InventoryTips';
import { useInventory } from '../hooks/useInventory';
import '../styles/inventory.css';
export default function SellerInventoryPage() {
  const hub = useInventory();
  const location = useLocation();
  return <main className="nx-stock-page"><div className="nx-container">{hub.loading && <p role="status">Đang tải kho hàng…</p>}{hub.error && <p role="alert">{hub.error}</p>}{location.state?.listingPublished && <p role="status">Đăng bán thành công. Sản phẩm đã được lưu vào hệ thống — đây không phải xác nhận đơn hàng.</p>}<InventoryOverview onAction={hub.action} /><InventoryFilters hub={hub} /><InventoryTable hub={hub} /><InventoryTips /></div></main>;
}
