import type { useAdminFulfillment } from '../hooks/useAdminFulfillment';

export function AdminFulfillmentHeader({ loading, loadData }: ReturnType<typeof useAdminFulfillment>) {
  return (
    <div className="nx-page-header">
      <div>
        <h1 className="nx-page-title">Kho hàng & tồn kho</h1>
        <p className="nx-page-subtitle">Theo dõi số lượng hàng và quản lý các kho.</p>
      </div>
      <button type="button" className="nx-btn nx-btn-outline" onClick={() => void loadData()} disabled={loading}>
        <i className="bi bi-arrow-clockwise" aria-hidden="true" /> {loading ? 'Đang tải…' : 'Làm mới'}
      </button>
    </div>
  );
}
