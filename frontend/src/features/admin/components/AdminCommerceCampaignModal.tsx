import AdminModal from '../components/AdminModal';
import type { CampaignStatus } from '../types/admin.types';
import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceCampaignModal(model: ReturnType<typeof useAdminCommerce>) {
  const { selectedCampaign, showCampaignModal, setShowCampaignModal, campaignForm, setCampaignForm, handleSaveCampaign } = model;
  return (
    <AdminModal
      isOpen={showCampaignModal}
      onClose={() => setShowCampaignModal(false)}
      title={selectedCampaign ? 'Chỉnh sửa chiến dịch khuyến mãi' : 'Tạo chiến dịch khuyến mãi mới'}
      maxWidth="600px"
    >
      <form onSubmit={handleSaveCampaign}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#1e40af',
            }}
          >
            <i className="bi bi-info-circle-fill me-1"></i>
            Chiến dịch (Campaign) là chương trình khuyến mãi theo mùa/sự kiện.
            Sau khi tạo chiến dịch, bạn có thể tạo các mã giảm giá (Vouchers) gắn vào chiến dịch này.
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Tên chiến dịch *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              className="form-control"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              placeholder="VD: Siêu hội mua sắm 11/11, Lễ hội mùa thu 2026..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Mô tả chiến dịch
            </label>
            <textarea
              className="form-control"
              rows={3}
              maxLength={2000}
              value={campaignForm.description}
              onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
              placeholder="Mô tả mục tiêu, đối tượng áp dụng của chiến dịch..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Ngày bắt đầu
              </label>
              <input
                type="date"
                className="form-control"
                value={campaignForm.startDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Ngày kết thúc
              </label>
              <input
                type="date"
                className="form-control"
                value={campaignForm.endDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Trạng thái
            </label>
            <select
              className="form-control"
              value={campaignForm.status}
              onChange={(e) =>
                setCampaignForm({ ...campaignForm, status: e.target.value as CampaignStatus })
              }
            >
              <option value="ACTIVE">ACTIVE (Kích hoạt ngay)</option>
              <option value="DRAFT">DRAFT (Lưu bản nháp)</option>
              {selectedCampaign && <option value="ENDED">ENDED (Đã kết thúc)</option>}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              onClick={() => setShowCampaignModal(false)}
            >
              Huỷ
            </button>
            <button type="submit" className="nx-btn nx-btn-primary">
              {selectedCampaign ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
            </button>
          </div>
        </div>
      </form>
    </AdminModal>
  );
}
