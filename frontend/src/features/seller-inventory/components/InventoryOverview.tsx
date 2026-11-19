import { Link } from 'react-router-dom';

export interface InventoryOverviewProps {
  onAddProduct?: () => void;
}

export default function InventoryOverview({ onAddProduct }: InventoryOverviewProps) {
  return <header className="nx-stock-heading"><div className="nx-stock-heading-copy"><Link className="nx-seller-back" to="/seller-hub">← Kênh người bán</Link><h1>Sản phẩm & tồn kho</h1><p>Cập nhật sản phẩm, giá niêm yết và số lượng có thể bán.</p></div>{onAddProduct ? <button type="button" className="nx-stock-button nx-seller-primary" onClick={onAddProduct}><i className="bi bi-plus-lg" aria-hidden="true" />Thêm sản phẩm</button> : <Link className="nx-stock-button nx-seller-primary" to="/seller/products/new"><i className="bi bi-plus-lg" aria-hidden="true" />Thêm sản phẩm</Link>}</header>;
}
