import type { useAdminCatalog } from '../hooks/useAdminCatalog';

export function AdminCatalogReviewsPanel(model: ReturnType<typeof useAdminCatalog>) {
  const { activeTab, reviews, handleApproveReview, handleRejectReview } = model;
  return (
    <>
          {activeTab === 'reviews' && (
            <div className="nx-admin-card">
              <div className="nx-admin-card-header">
                <h2 className="nx-admin-card-title">Quản lý đánh giá sản phẩm</h2>
              </div>
              <div className="nx-table-container">
                <table className="nx-admin-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Người đánh giá</th>
                      <th>Số sao</th>
                      <th>Nội dung bình luận</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác kiểm duyệt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.productName}</strong>
                        </td>
                        <td>{r.userFullName}</td>
                        <td>
                          <span style={{ color: '#eab308' }}>
                            {'★'.repeat(r.rating)}
                            {'☆'.repeat(5 - r.rating)}
                          </span>
                        </td>
                        <td style={{ maxWidth: '300px' }}>"{r.comment}"</td>
                        <td>
                          <span
                            className={`nx-badge ${r.status === 'VISIBLE'
                                ? 'nx-badge-success'
                                : r.status === 'HIDDEN'
                                  ? 'nx-badge-danger'
                                  : 'nx-badge-warning'
                              }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {r.status !== 'VISIBLE' && (
                              <button
                                type="button"
                                className="nx-btn nx-btn-primary nx-btn-sm"
                                onClick={() => handleApproveReview(r.id)}
                              >
                                <i className="bi bi-check-lg"></i> Hiển thị lại
                              </button>
                            )}
                            {r.status !== 'HIDDEN' && (
                              <button
                                type="button"
                                className="nx-btn nx-btn-outline nx-btn-sm"
                                style={{ color: '#dc2626' }}
                                onClick={() => handleRejectReview(r.id)}
                              >
                                <i className="bi bi-eye-slash"></i> Ẩn
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
  );
}
