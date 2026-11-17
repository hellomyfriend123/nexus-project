import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceCouponsPanel(model: ReturnType<typeof useAdminCommerce>) {
  const { activeTab, campaigns, coupons, couponStatusFilter, setCouponStatusFilter, couponCampaignFilter, setCouponCampaignFilter, handleOpenCreateCoupon, handleOpenEditCoupon, handleToggleCoupon, getCampaignName, formatCurrency } = model;
  return (
    <>
          {activeTab === 'coupons' && (
            <div className="nx-admin-card">
              <div className="nx-admin-card-header">
                <div>
                  <h2 className="nx-admin-card-title">Quản lý Voucher & Mã giảm giá (Discount Codes)</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Mã giảm giá cụ thể người mua nhập khi đặt hàng (FR-47, FR-58). Có thể trực thuộc một Chiến dịch hoặc áp dụng độc lập toàn sàn.
                  </p>
                </div>
                <button
                  type="button"
                  className="nx-btn nx-btn-primary nx-btn-sm"
                  onClick={handleOpenCreateCoupon}
                >
                  <i className="bi bi-plus-lg"></i> Thêm mã giảm giá
                </button>
              </div>

              <div className="nx-filter-bar">
                <select
                  value={couponStatusFilter}
                  onChange={(e) => setCouponStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái voucher</option>
                  <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
                  <option value="INACTIVE">INACTIVE (Đã vô hiệu)</option>
                </select>

                <select
                  value={couponCampaignFilter}
                  onChange={(e) => setCouponCampaignFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả chiến dịch</option>
                  {campaigns.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      Chiến dịch: {camp.name}
                    </option>
                  ))}
                </select>
                {couponCampaignFilter !== 'ALL' && (
                  <button
                    type="button"
                    className="nx-btn nx-btn-outline nx-btn-sm"
                    onClick={() => setCouponCampaignFilter('ALL')}
                  >
                    <i className="bi bi-x-circle me-1"></i> Bỏ lọc chiến dịch
                  </button>
                )}
              </div>

              <div className="nx-table-container">
                <table className="nx-admin-table">
                  <thead>
                    <tr>
                      <th>Mã Voucher (Code)</th>
                      <th>Thuộc Chiến dịch</th>
                      <th>Mức giảm giá</th>
                      <th>Đơn tối thiểu</th>
                      <th>Đã dùng / Giới hạn</th>
                      <th>Thời hạn</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                          <i className="bi bi-ticket-perforated" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                          Không tìm thấy mã giảm giá nào phù hợp bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <code
                              style={{
                                fontSize: '13px',
                                color: '#315bf4',
                                fontWeight: 700,
                                padding: '3px 8px',
                                background: '#eff6ff',
                                borderRadius: '4px',
                              }}
                            >
                              {c.code}
                            </code>
                          </td>
                          <td>
                            {c.campaignId ? (
                              <span className="nx-badge nx-badge-primary" title={`Campaign ID: ${c.campaignId}`}>
                                <i className="bi bi-megaphone me-1"></i>
                                {getCampaignName(c.campaignId)}
                              </span>
                            ) : (
                              <span className="nx-badge nx-badge-secondary">Toàn sàn (Độc lập)</span>
                            )}
                          </td>
                          <td>
                            {c.discountType === 'PERCENTAGE' ? (
                              <span className="nx-badge nx-badge-warning" style={{ fontWeight: 700 }}>
                                -{c.discountValue}%
                              </span>
                            ) : (
                              <span className="nx-badge nx-badge-success" style={{ fontWeight: 700 }}>
                                -{formatCurrency(c.discountValue)}
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(c.minOrderAmount)}</td>
                          <td>
                            <strong>{c.usedCount}</strong> /{' '}
                            {c.usageLimit !== undefined && c.usageLimit !== null ? c.usageLimit : '∞'} lượt
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            {c.endAt ? new Date(c.endAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                          </td>
                          <td>
                            <span
                              className={`nx-badge ${
                                c.status === 'ACTIVE' ? 'nx-badge-success' : 'nx-badge-secondary'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="nx-btn nx-btn-outline nx-btn-sm"
                                onClick={() => handleOpenEditCoupon(c)}
                                title="Chỉnh sửa mã giảm giá (PUT /api/v1/admin/commerce/discount-codes/{id})"
                              >
                                <i className="bi bi-pencil"></i> Sửa
                              </button>
                              <button
                                type="button"
                                className="nx-btn nx-btn-outline nx-btn-sm"
                                onClick={() => handleToggleCoupon(c.id, c.status)}
                                title="Bật/Tắt trạng thái (PATCH /api/v1/admin/commerce/discount-codes/{id}/status)"
                              >
                                <i className="bi bi-toggle-on"></i> {c.status === 'ACTIVE' ? 'Tắt' : 'Bật'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
  );
}
