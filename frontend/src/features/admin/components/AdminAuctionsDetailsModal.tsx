import AdminModal from '../components/AdminModal';
import type { useAdminAuctions } from '../hooks/useAdminAuctions';

export function AdminAuctionsDetailsModal(model: ReturnType<typeof useAdminAuctions>) {
  const { selectedAuction, setSelectedAuction, handleCancelAuction, formatCurrency } = model;
  return (
    <AdminModal
      isOpen={Boolean(selectedAuction)}
      onClose={() => setSelectedAuction(null)}
      title="Chi tiết phiên đấu giá & Lịch sử trả giá (FR-57)"
      maxWidth="700px"
    >
      {selectedAuction && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>
              {selectedAuction.title}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Mã phiên: <code>{selectedAuction.id}</code> | Người tổ chức:{' '}
              <strong>{selectedAuction.sellerName || 'Nexus Seller'}</strong>
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>Giá khởi điểm:</span>
              <div style={{ fontWeight: 600 }}>{formatCurrency(selectedAuction.startingPrice)}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Giá hiện tại:</span>
              <div style={{ fontWeight: 700, color: '#c6002e', fontSize: '15px' }}>
                {formatCurrency(selectedAuction.currentBid)}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Trạng thái:</span>
              <div>
                <span className="nx-badge nx-badge-primary">{selectedAuction.status}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Lịch sử trả giá ({selectedAuction.bids?.length || 0} lượt)
            </h4>
            {(!selectedAuction.bids || selectedAuction.bids.length === 0) ? (
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
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              >
                <table className="nx-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Người đấu giá</th>
                      <th>Số tiền đặt</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAuction.bids.map((b, idx) => (
                      <tr key={b.id || idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{b.bidderName || b.bidderEmail || 'Ẩn danh'}</strong>
                        </td>
                        <td>
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
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {new Date(b.bidTime).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            {(selectedAuction.status === 'ACTIVE' || selectedAuction.status === 'SCHEDULED') ? (
              <button
                type="button"
                className="nx-btn nx-btn-danger nx-btn-sm"
                onClick={() => handleCancelAuction(selectedAuction.id, selectedAuction.title)}
              >
                <i className="bi bi-x-circle me-1"></i> Hủy phiên đấu giá này (FR-37)
              </button>
            ) : <div />}
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              onClick={() => setSelectedAuction(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </AdminModal>
  );
}
