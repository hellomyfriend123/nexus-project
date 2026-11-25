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
        <i className="bi bi-folder me-1"></i> Danh mục sản phẩm (5 tasks)
      </button>
      <button
        type="button"
        className={`nx-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
        onClick={() => setActiveTab('products')}
      >
        <i className="bi bi-box me-1"></i> Sản phẩm trên sàn (3 tasks)
      </button>
      <button
        type="button"
        className={`nx-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
        onClick={() => setActiveTab('reviews')}
      >
        <i className="bi bi-star-half me-1"></i> Kiểm duyệt đánh giá (2 tasks)
      </button>
    </div>
  );
}
