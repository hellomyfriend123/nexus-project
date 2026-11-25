import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import InventoryOverview from '../components/InventoryOverview';
import InventoryFilters from '../components/InventoryFilters';
import InventoryTable from '../components/InventoryTable';
import InventoryEditor from '../components/InventoryEditor';
import { useInventory } from '../hooks/useInventory';
import '../styles/inventory.css';

export interface SellerInventoryPageProps {
  /**
   * When true the page renders only the list and delegates "Thêm sản phẩm" to onAddProduct.
   */
  controlled?: boolean;
  onAddProduct?: () => void;
}

export default function SellerInventoryPage({ controlled = false, onAddProduct }: SellerInventoryPageProps) {
  const hub=useInventory();const location=useLocation();
  const [published]=useState(Boolean(location.state?.listingPublished));
  return <main className="nx-stock-page"><div className="nx-container"><InventoryOverview onAddProduct={controlled ? onAddProduct : undefined} />{published&&<p role="status" className="nx-seller-success">Sản phẩm đã được lưu.</p>}{hub.loading?<p role="status">Đang tải kho hàng…</p>:hub.error?<div role="alert" className="nx-seller-alert"><p>{hub.error}</p><button type="button" onClick={hub.retry}>Thử lại</button></div>:<><InventoryFilters hub={hub} /><InventoryTable hub={hub} /></>}<InventoryEditor hub={hub} /></div></main>;
}
