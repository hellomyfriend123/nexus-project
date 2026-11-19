import type { useAdminAuctions } from '../hooks/useAdminAuctions';

export function AdminAuctionsHeader({ loading, loadAuctions }: ReturnType<typeof useAdminAuctions>) {
  return (
    <div className="nx-page-header">
      <div>
        <h1 className="nx-page-title">Đấu giá</h1>
        <p className="nx-page-subtitle">Theo dõi phiên đấu giá và lịch sử trả giá.</p>
      </div>
      <button type="button" className="nx-btn nx-btn-outline" onClick={() => void loadAuctions()} disabled={loading}>
        <i className="bi bi-arrow-clockwise" aria-hidden="true" /> {loading ? 'Đang tải…' : 'Làm mới'}
      </button>
    </div>
  );
}
