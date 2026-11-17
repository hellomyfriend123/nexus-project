import type { useAdminAuctions } from '../hooks/useAdminAuctions';

export function AdminAuctionsTable(model: ReturnType<typeof useAdminAuctions>) {
  const { setSelectedAuction, handleCancelAuction, formatCurrency, filteredAuctions } = model;
  return (
    <table className="nx-table">
                <thead>
                  <tr>
                    <th>Phiên đấu giá</th>
                    <th>Người bán</th>
                    <th>Giá khởi điểm</th>
                    <th>Giá cao nhất hiện tại</th>
                    <th>Lượt trả giá</th>
                    <th>Thời gian kết thúc</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuctions.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        Không có phiên đấu giá nào phù hợp.
                      </td>
                    </tr>
                  )}
                  {filteredAuctions.map((auc) => (
                    <tr key={auc.id}>
                      <td>
                        <div>
                          <strong style={{ fontSize: '13.5px' }}>{auc.title}</strong>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            ID: <code>{auc.id.slice(0, 8)}...</code>
                          </div>
                        </div>
                      </td>
                      <td>{auc.sellerName || 'Nexus Seller'}</td>
                      <td>{formatCurrency(auc.startingPrice)}</td>
                      <td>
                        <strong style={{ color: '#059669', fontSize: '14px' }}>
                          {formatCurrency(auc.currentBid)}
                        </strong>
                      </td>
                      <td>
                        <span className="nx-badge nx-badge-secondary">
                          <i className="bi bi-hammer me-1"></i> {auc.totalBids ?? (auc.bids?.length || 0)} lượt
                        </span>
                      </td>
                      <td>{new Date(auc.endTime).toLocaleString('vi-VN')}</td>
                      <td>
                        <span
                          className={`nx-badge ${
                            auc.status === 'ACTIVE'
                              ? 'nx-badge-danger'
                              : auc.status === 'SCHEDULED'
                                ? 'nx-badge-primary'
                                : auc.status === 'ENDED'
                                  ? 'nx-badge-success'
                                  : 'nx-badge-secondary'
                          }`}
                        >
                          {auc.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="nx-btn nx-btn-outline nx-btn-sm"
                            onClick={() => setSelectedAuction(auc)}
                            title="Xem chi tiết & lịch sử trả giá (FR-57)"
                          >
                            <i className="bi bi-clock-history"></i> Bids
                          </button>
                          {(auc.status === 'ACTIVE' || auc.status === 'SCHEDULED') && (
                            <button
                              type="button"
                              className="nx-btn nx-btn-danger nx-btn-sm"
                              onClick={() => handleCancelAuction(auc.id, auc.title)}
                              title="Hủy phiên đấu giá khẩn cấp (POST /api/v1/admin/auction/auctions/{id}/cancel)"
                            >
                              <i className="bi bi-x-circle"></i> Hủy phiên
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
  );
}
