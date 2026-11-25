import type { useAdminFulfillment } from '../hooks/useAdminFulfillment';

export function AdminFulfillmentTabs(model: ReturnType<typeof useAdminFulfillment>) {
  const { activeTab, setActiveTab } = model;
  return (
    <div className="nx-tabs">
      <button
        type="button"
        className={`nx-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
        onClick={() => setActiveTab('inventory')}
      >
        <i className="bi bi-box-seam me-1"></i> Giám sát tồn kho (1 task)
      </button>
      <button
        type="button"
        className={`nx-tab-btn ${activeTab === 'warehouses' ? 'active' : ''}`}
        onClick={() => setActiveTab('warehouses')}
      >
        <i className="bi bi-buildings me-1"></i> Mạng lưới kho hàng (4 tasks)
      </button>
    </div>
  );
}
