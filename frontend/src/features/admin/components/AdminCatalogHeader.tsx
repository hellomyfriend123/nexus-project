import type { useAdminCatalog } from '../hooks/useAdminCatalog';

export function AdminCatalogHeader({ loading, loadData }: ReturnType<typeof useAdminCatalog>) {
  return (
    <div className="nx-page-header">
      <div>
        <h1 className="nx-page-title">Danh mục & sản phẩm</h1>
        <p className="nx-page-subtitle">Quản lý danh mục, sản phẩm và đánh giá.</p>
      </div>
      <button type="button" className="nx-btn nx-btn-outline" onClick={() => void loadData()} disabled={loading}>
        <i className="bi bi-arrow-clockwise" aria-hidden="true" /> {loading ? 'Đang tải…' : 'Làm mới'}
      </button>
    </div>
  );
}
