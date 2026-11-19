import type { SellerTabId } from '../types/sellerHub';
interface Props { activeTab: SellerTabId; onTabChange: (tab: SellerTabId) => void }
const tabs: { id: SellerTabId; label: string; icon: string }[] = [{id:'products', label:'Tổng quan', icon:'grid'}, {id:'orders',label:'Đơn hàng',icon:'box-seam'}, {id:'auctions',label:'Đấu giá',icon:'hammer'}];
export default function SellerOverview({ activeTab, onTabChange }: Props) {
  return <><header className="nx-seller-heading"><div className="nx-seller-heading-copy"><h1>Kênh người bán</h1><p>Theo dõi đơn hàng và quản lý hoạt động bán hàng của bạn.</p></div></header><div className="nx-seller-tabs" role="tablist" aria-label="Kênh người bán">{tabs.map(tab => <button key={tab.id} type="button" role="tab" id={`hub-tab-${tab.id}`} aria-controls={`hub-panel-${tab.id}`} aria-selected={activeTab === tab.id} className={`nx-seller-tab ${activeTab === tab.id ? 'is-active' : ''}`} onClick={() => onTabChange(tab.id)}><i className={`bi bi-${tab.icon}`} aria-hidden="true" />{tab.label}</button>)}</div></>;
}
