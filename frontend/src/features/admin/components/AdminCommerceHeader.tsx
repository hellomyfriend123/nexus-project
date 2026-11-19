import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceHeader({ loading, loadData }: ReturnType<typeof useAdminCommerce>) {
  return (
    <div className="nx-page-header">
      <div>
        <h1 className="nx-page-title">Đơn hàng & khuyến mãi</h1>
        <p className="nx-page-subtitle">Theo dõi đơn hàng, chiến dịch và mã giảm giá.</p>
      </div>
      <button type="button" className="nx-btn nx-btn-outline" onClick={() => void loadData()} disabled={loading}>
        <i className="bi bi-arrow-clockwise" aria-hidden="true" /> {loading ? 'Đang tải…' : 'Làm mới'}
      </button>
    </div>
  );
}
