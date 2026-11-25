import type { useAdminCatalog } from '../hooks/useAdminCatalog';

export function AdminCatalogTabs(model: ReturnType<typeof useAdminCatalog>) {
  const { activeTab, setActiveTab } = model;
  return (
    <div className="nx-tabs">
      <button
        type="button"
        className={`nx-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
        onClick={() => setActiveTab('categories')}
      >
        <i className="bi bi-folder me-1" aria-hidden="true"></i> Danh mục sản phẩm
      </button>
      <button
        type="button"
        className={`nx-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
        onClick={() => setActiveTab('products')}
      >
        <i className="bi bi-box me-1" aria-hidden="true"></i> Sản phẩm trên sàn
      </button>
    </div>
  );
}
