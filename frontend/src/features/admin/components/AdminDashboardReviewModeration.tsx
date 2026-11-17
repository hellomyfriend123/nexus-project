import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardReviewModeration(model: ReturnType<typeof useAdminDashboard>) {
  const { navigate, pendingReviews, handleApproveReview, handleRejectReview } = model;
  return (
    <div className="nx-admin-card">
      <div className="nx-admin-card-header">
        <h2 className="nx-admin-card-title">
          <i className="bi bi-shield-check me-2 text-warning"></i> Đánh giá chờ duyệt (FR-45)
        </h2>
        <button
          type="button"
          className="nx-btn nx-btn-outline nx-btn-sm"
          onClick={() => navigate('/admin/catalog')}
        >
          Quản lý đánh giá
        </button>
      </div>
      <div className="nx-admin-card-body" style={{ padding: '12px' }}>
        {pendingReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
            <i className="bi bi-check-circle" style={{ fontSize: '32px', color: '#10b981' }}></i>
            <p style={{ marginTop: '8px', fontSize: '13px' }}>Chưa có API đánh giá chờ duyệt (chỉ hỗ trợ VISIBLE/HIDDEN).</p>
          </div>
        ) : (
          pendingReviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                padding: '12px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{rev.productName}</span>
                <span style={{ color: '#eab308', fontSize: '12px' }}>
                  {'★'.repeat(rev.rating)}
                  {'☆'.repeat(5 - rev.rating)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>
                "{rev.comment}" — <em>{rev.userFullName}</em>
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="nx-btn nx-btn-primary nx-btn-sm"
                  onClick={() => handleApproveReview(rev.id)}
                >
                  <i className="bi bi-check-lg"></i> Duyệt
                </button>
                <button
                  type="button"
                  className="nx-btn nx-btn-outline nx-btn-sm"
                  style={{ color: '#dc2626' }}
                  onClick={() => handleRejectReview(rev.id)}
                >
                  <i className="bi bi-eye-slash"></i> Ẩn
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
