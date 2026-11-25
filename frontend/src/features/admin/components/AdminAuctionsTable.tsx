import type React from 'react';
import type { useAdminAuctions } from '../hooks/useAdminAuctions';

const cellDividerStyle: React.CSSProperties = {
  borderRight: '1px solid #f1f5f9',
};

export function AdminAuctionsTable(model: ReturnType<typeof useAdminAuctions>) {
  const {
    loading,
    setSelectedAuction,
    handleCancelAuction,
    formatCurrency,
    filteredAuctions,
    resolveProductName,
    resolveUser,
    getCurrentPrice,
    getBidCount,
    getHighestBidder,
    getStatusBadge,
  } = model;

  return (
    <table className="nx-admin-table">
      <thead>
        <tr>
          <th style={{ ...cellDividerStyle, minWidth: '210px' }}>Sản phẩm / Phiên</th>
          <th style={{ ...cellDividerStyle, minWidth: '160px' }}>Người bán</th>
          <th style={{ ...cellDividerStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
            Giá khởi điểm
          </th>
          <th style={{ ...cellDividerStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
            Giá hiện tại
          </th>
          <th style={{ ...cellDividerStyle, minWidth: '175px' }}>Người trả giá cao nhất</th>
          <th style={{ ...cellDividerStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
            Lượt trả giá
          </th>
          <th style={{ ...cellDividerStyle, minWidth: '155px', whiteSpace: 'nowrap' }}>
            Thời gian kết thúc
          </th>
          <th style={{ ...cellDividerStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
            Trạng thái
          </th>
          <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {filteredAuctions.length === 0 ? (
          <tr>
            <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
              {loading
                ? 'Đang tải danh sách phiên đấu giá...'
                : 'Không có phiên đấu giá nào phù hợp.'}
            </td>
          </tr>
        ) : (
          filteredAuctions.map((auc) => {
            const prodTitle = resolveProductName(auc);
            const seller = resolveUser(auc.sellerId, auc.sellerName);
            const currentPrice = getCurrentPrice(auc);
            const hasHigherBid = currentPrice > (auc.startingPrice || 0);
            const highestBidder = getHighestBidder(auc);
            const bidTotal = getBidCount(auc);
            const statusBadge = getStatusBadge(auc.status);

            return (
              <tr key={auc.id}>
                <td style={cellDividerStyle}>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                    {prodTitle}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Mã phiên: <code>{auc.id.slice(0, 8)}...</code>
                  </div>
                </td>

                <td style={cellDividerStyle}>
                  <div style={{ fontWeight: 500, color: '#1e293b' }}>
                    {seller?.fullName || 'Chưa rõ'}
                  </div>
                  {seller?.email && (
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>{seller.email}</div>
                  )}
                </td>

                <td
                  style={{
                    ...cellDividerStyle,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    color: '#475569',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatCurrency(auc.startingPrice)}
                </td>

                <td
                  style={{
                    ...cellDividerStyle,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '14px',
                      color: hasHigherBid ? '#059669' : '#0f172a',
                    }}
                  >
                    {formatCurrency(currentPrice)}
                  </div>
                  {hasHigherBid && (
                    <div style={{ fontSize: '11px', color: '#059669' }}>
                      +{formatCurrency(currentPrice - (auc.startingPrice || 0))}
                    </div>
                  )}
                </td>

                <td style={cellDividerStyle}>
                  {highestBidder ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#1d4ed8' }}>
                        <i className="bi bi-person-check-fill me-1" aria-hidden="true"></i>
                        {highestBidder.fullName}
                      </div>
                      {highestBidder.email && (
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          {highestBidder.email}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                      Chưa có người trả giá
                    </span>
                  )}
                </td>

                <td style={{ ...cellDividerStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <span
                    className={`nx-badge ${
                      bidTotal > 0 ? 'nx-badge-primary' : 'nx-badge-secondary'
                    }`}
                  >
                    <i className="bi bi-hammer me-1" aria-hidden="true"></i> {bidTotal} lượt
                  </span>
                </td>

                <td style={{ ...cellDividerStyle, whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: '13px', color: '#1e293b' }}>
                    {new Date(auc.endTime).toLocaleString('vi-VN')}
                  </div>
                  {auc.startTime && (
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Bắt đầu: {new Date(auc.startTime).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </td>

                <td style={{ ...cellDividerStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <span className={`nx-badge ${statusBadge.cls}`}>{statusBadge.label}</span>
                </td>

                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="nx-btn nx-btn-outline nx-btn-sm"
                      onClick={() => setSelectedAuction(auc)}
                      title="Xem chi tiết & lịch sử trả giá"
                    >
                      <i className="bi bi-clock-history" aria-hidden="true"></i> Lịch sử ({bidTotal})
                    </button>
                    {(auc.status === 'ACTIVE' ||
                      auc.status === 'SCHEDULED' ||
                      (auc.status as string) === 'UPCOMING') && (
                      <button
                        type="button"
                        className="nx-btn nx-btn-danger nx-btn-sm"
                        onClick={() => handleCancelAuction(auc.id, prodTitle)}
                        title="Hủy phiên đấu giá khẩn cấp"
                      >
                        <i className="bi bi-x-circle" aria-hidden="true"></i> Hủy phiên
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
