import { useState, useEffect, useCallback } from 'react';
import AdminModal from '../components/AdminModal';
import { adminAuctionApi } from '../../../services/api/adminApi';
import type {
  AdminAuction,
} from '../../../features/admin/types/admin.types';

export function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<AdminAuction[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAuction, setSelectedAuction] = useState<AdminAuction | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUsingRealApi, setIsUsingRealApi] = useState(false);

  const loadAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAuctionApi.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      if (res && Array.isArray(res.content)) {
        setAuctions(res.content);
        setIsUsingRealApi(true);
      } else {
        setAuctions([]);
      }
    } catch {
      setIsUsingRealApi(false);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  const handleCancelAuction = async (id: string, title?: string) => {
    if (confirm(`Bạn có chắc chắn muốn hủy phiên đấu giá "${title || id}" theo quyền Admin (FR-37)?`)) {
      try {
        await adminAuctionApi.cancel(id);
        alert('Đã hủy phiên đấu giá thành công qua REST API!');
        setSelectedAuction(null);
        loadAuctions();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
        alert(`Không thể hủy phiên đấu giá:\n${errorMsg}`);
      }
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const filteredAuctions = auctions.filter((a) =>
    statusFilter === 'ALL' ? true : a.status === statusFilter,
  );

  return (
    <div>
      <div className="nx-page-header">
        <div>
          <h1 className="nx-page-title">Quản trị Đấu giá trực tuyến (FR-57)</h1>
          <p className="nx-page-subtitle">
            Kết nối REST API: <code>/api/v1/admin/auction/auctions</code>
            <span
              style={{
                marginLeft: '8px',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: isUsingRealApi ? '#ecfdf5' : '#fef3c7',
                color: isUsingRealApi ? '#059669' : '#d97706',
                fontWeight: 600,
              }}
            >
              {isUsingRealApi ? '● Live REST API' : '○ Lỗi kết nối API'}
            </span>
          </p>
        </div>
        <button
          type="button"
          className="nx-btn nx-btn-outline"
          onClick={loadAuctions}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i> {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="nx-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'UPCOMING', label: 'Sắp diễn ra' },
            { key: 'ACTIVE', label: 'Đang diễn ra' },
            { key: 'ENDED', label: 'Đã kết thúc' },
            { key: 'CANCELLED', label: 'Đã huỷ' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`nx-btn nx-btn-sm ${
                statusFilter === tab.key ? 'nx-btn-primary' : 'nx-btn-outline'
              }`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auctions Table */}
      <div className="nx-card">
        <div className="table-responsive">
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
                          : auc.status === 'UPCOMING'
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
                      {(auc.status === 'ACTIVE' || auc.status === 'UPCOMING') && (
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
        </div>
      </div>

      {/* Task A-1: View Auction Details & Bid History Modal */}
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
              {(selectedAuction.status === 'ACTIVE' || selectedAuction.status === 'UPCOMING') ? (
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
    </div>
  );
}

export default AdminAuctionsPage;
