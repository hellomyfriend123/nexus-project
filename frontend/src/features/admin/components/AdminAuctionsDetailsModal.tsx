import type React from 'react';
import AdminModal from '../components/AdminModal';
import type { useAdminAuctions } from '../hooks/useAdminAuctions';

const cellDividerStyle: React.CSSProperties = {
  borderRight: '1px solid #f1f5f9',
};

export function AdminAuctionsDetailsModal(model: ReturnType<typeof useAdminAuctions>) {
  const {
    selectedAuction,
    setSelectedAuction,
    handleCancelAuction,
    formatCurrency,
    resolveProductName,
    resolveUser,
    getCurrentPrice,
    getHighestBidder,
    getStatusBadge,
  } = model;

  return (
    <AdminModal
      isOpen={Boolean(selectedAuction)}
      onClose={() => setSelectedAuction(null)}
      title="Chi tiết phiên đấu giá & Lịch sử trả giá"
      maxWidth="760px"
    >
      {selectedAuction &&
        (() => {
          const modalTitle = resolveProductName(selectedAuction);
          const modalSeller = resolveUser(selectedAuction.sellerId, selectedAuction.sellerName);
          const modalCurrentPrice = getCurrentPrice(selectedAuction);
          const modalHighestBidder = getHighestBidder(selectedAuction);
          const modalStatus = getStatusBadge(selectedAuction.status);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>
                  {modalTitle}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Mã phiên: <code>{selectedAuction.id}</code> | Người bán:{' '}
                  <strong>{modalSeller?.fullName || 'Chưa rõ'}</strong>
                  {modalSeller?.email ? ` (${modalSeller.email})` : ''}
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Giá khởi điểm</span>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    {formatCurrency(selectedAuction.startingPrice)}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Giá hiện tại</span>
                  <div
                    style={{
                      fontWeight: 700,
                      color: '#059669',
                      fontSize: '15px',
                      marginTop: '2px',
                    }}
                  >
                    {formatCurrency(modalCurrentPrice)}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Đang dẫn đầu</span>
                  <div style={{ fontWeight: 600, color: '#1d4ed8', marginTop: '2px' }}>
                    {modalHighestBidder ? modalHighestBidder.fullName : 'Chưa có'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Trạng thái</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`nx-badge ${modalStatus.cls}`}>{modalStatus.label}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  Lịch sử trả giá ({selectedAuction.bids?.length || 0} lượt)
                </h4>
                {!selectedAuction.bids || selectedAuction.bids.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      color: '#94a3b8',
                      fontSize: '13px',
                    }}
                  >
                    Chưa có lượt trả giá nào trong phiên này.
                  </div>
                ) : (
                  <div
                    className="nx-table-container"
                    style={{
                      maxHeight: '280px',
                      overflowY: 'auto',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  >
                    <table className="nx-admin-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ ...cellDividerStyle, width: '48px' }}>#</th>
                          <th style={cellDividerStyle}>Người đấu giá</th>
                          <th style={{ ...cellDividerStyle, textAlign: 'right' }}>Số tiền đặt</th>
                          <th style={{ ...cellDividerStyle, textAlign: 'center' }}>Trạng thái</th>
                          <th>Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAuction.bids.map((b, idx) => {
                          const bidder = resolveUser(b.bidderId, b.bidderName, b.bidderEmail);
                          const bidTimestamp = b.placedAt || b.bidTime;
                          return (
                            <tr key={b.id || idx}>
                              <td style={cellDividerStyle}>{idx + 1}</td>
                              <td style={cellDividerStyle}>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                  {bidder?.fullName || 'Chưa rõ'}
                                </div>
                                {bidder?.email && (
                                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                    {bidder.email}
                                  </div>
                                )}
                              </td>
                              <td
                                style={{
                                  ...cellDividerStyle,
                                  textAlign: 'right',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <strong style={{ color: idx === 0 ? '#059669' : '#1e293b' }}>
                                  {formatCurrency(b.amount)}
                                </strong>
                                {idx === 0 && (
                                  <span
                                    className="nx-badge nx-badge-success"
                                    style={{ marginLeft: '6px', fontSize: '10px' }}
                                  >
                                    Cao nhất
                                  </span>
                                )}
                              </td>
                              <td style={{ ...cellDividerStyle, textAlign: 'center' }}>
                                <span className="nx-badge nx-badge-secondary">
                                  {b.status || 'ACCEPTED'}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                {bidTimestamp
                                  ? new Date(bidTimestamp).toLocaleString('vi-VN')
                                  : 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                }}
              >
                {selectedAuction.status === 'ACTIVE' ||
                selectedAuction.status === 'SCHEDULED' ||
                (selectedAuction.status as string) === 'UPCOMING' ? (
                  <button
                    type="button"
                    className="nx-btn nx-btn-danger nx-btn-sm"
                    onClick={() => handleCancelAuction(selectedAuction.id, modalTitle)}
                  >
                    <i className="bi bi-x-circle me-1" aria-hidden="true"></i> Hủy phiên đấu giá này
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  className="nx-btn nx-btn-outline"
                  onClick={() => setSelectedAuction(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          );
        })()}
    </AdminModal>
  );
}
