import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceCampaignsPanel(model: ReturnType<typeof useAdminCommerce>) {
  const { activeTab, setActiveTab, campaigns, campaignStatusFilter, setCampaignStatusFilter, setCouponCampaignFilter, handleOpenCreateCampaign, handleOpenEditCampaign, handleEndCampaign } = model;
  return (
    <>
          {activeTab === 'campaigns' && (
            <div className="nx-admin-card">
              <div className="nx-admin-card-header">
                <div>
                  <h2 className="nx-admin-card-title">Chiến dịch khuyến mãi toàn sàn</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Khung chương trình marketing tổng thể theo mùa/sự kiện. Mỗi chiến dịch có thể chứa nhiều Mã giảm giá trực thuộc.
                  </p>
                </div>
                <button
                  type="button"
                  className="nx-btn nx-btn-primary nx-btn-sm"
                  onClick={handleOpenCreateCampaign}
                >
                  <i className="bi bi-plus-lg"></i> Tạo chiến dịch mới
                </button>
              </div>

              <div className="nx-filter-bar">
                <select
                  value={campaignStatusFilter}
                  onChange={(e) => setCampaignStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái chiến dịch</option>
                  <option value="ACTIVE">ACTIVE (Đang diễn ra)</option>
                  <option value="DRAFT">DRAFT (Bản nháp)</option>
                  <option value="ENDED">ENDED (Đã kết thúc)</option>
                </select>
              </div>

              <div className="nx-table-container">
                <table className="nx-admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Tên chiến dịch</th>
                      <th style={{ width: '35%' }}>Mô tả</th>
                      <th>Thời gian diễn ra</th>
                      <th>Trạng thái</th>
                      <th>Mã giảm giá trực thuộc</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                          <i className="bi bi-megaphone" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                          Chưa có chiến dịch khuyến mãi nào. Bấm &quot;Tạo chiến dịch mới&quot; để thiết lập chương trình.
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((camp) => (
                        <tr key={camp.id}>
                          <td>
                            <strong style={{ color: '#1e293b', fontSize: '14px' }}>{camp.name}</strong>
                          </td>
                          <td style={{ color: '#475569', fontSize: '12.5px', lineHeight: 1.4 }}>
                            {camp.description || <em style={{ color: '#64748b' }}>Không có mô tả</em>}
                          </td>
                          <td style={{ fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                            <div>
                              <i className="bi bi-calendar-event me-1 text-primary"></i>
                              {camp.startDate ? new Date(camp.startDate).toLocaleDateString('vi-VN') : 'Bắt đầu'}
                            </div>
                            <div style={{ color: '#64748b' }}>
                              → {camp.endDate ? new Date(camp.endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`nx-badge ${
                                camp.status === 'ACTIVE'
                                  ? 'nx-badge-success'
                                  : camp.status === 'DRAFT'
                                    ? 'nx-badge-warning'
                                    : 'nx-badge-secondary'
                              }`}
                            >
                              {camp.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="nx-btn nx-btn-outline nx-btn-sm"
                              style={{ fontSize: '11.5px', padding: '3px 8px' }}
                              onClick={() => {
                                setCouponCampaignFilter(camp.id);
                                setActiveTab('coupons');
                              }}
                              title="Lọc các mã giảm giá thuộc chiến dịch này"
                            >
                              <i className="bi bi-ticket-detailed me-1 text-primary"></i>
                              Xem mã giảm giá
                            </button>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="nx-btn nx-btn-outline nx-btn-sm"
                                onClick={() => handleOpenEditCampaign(camp)}
                                title="Chỉnh sửa chiến dịch"
                              >
                                <i className="bi bi-pencil"></i> Sửa
                              </button>
                              {camp.status !== 'ENDED' && (
                                <button
                                  type="button"
                                  className="nx-btn nx-btn-danger nx-btn-sm"
                                  onClick={() => handleEndCampaign(camp.id)}
                                  title="Kết thúc chiến dịch"
                                >
                                  <i className="bi bi-stop-circle"></i> Kết thúc
                                </button>
                              )}
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
