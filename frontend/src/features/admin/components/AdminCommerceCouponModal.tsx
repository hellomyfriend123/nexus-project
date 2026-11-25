import AdminModal from '../components/AdminModal';
import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceCouponModal(model: ReturnType<typeof useAdminCommerce>) {
  const { campaigns, selectedCoupon, showCouponModal, setShowCouponModal, couponForm, setCouponForm, handleSaveCoupon } = model;
  return (
    <AdminModal
      isOpen={showCouponModal}
      onClose={() => setShowCouponModal(false)}
      title={selectedCoupon ? 'Chỉnh sửa mã giảm giá (Voucher)' : 'Tạo mã giảm giá mới (Voucher)'}
      maxWidth="620px"
    >
      <form onSubmit={handleSaveCoupon}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Chiến dịch khuyến mãi trực thuộc
            </label>
            <select
              className="form-control"
              value={couponForm.campaignId}
              onChange={(e) => setCouponForm({ ...couponForm, campaignId: e.target.value })}
            >
              <option value="">-- Áp dụng độc lập toàn sàn (Không thuộc chiến dịch) --</option>
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name} ({camp.status})
                </option>
              ))}
            </select>
            <small style={{ color: '#64748b', fontSize: '11.5px' }}>
              Mã giảm giá có thể gắn vào 1 chiến dịch cụ thể hoặc phát hành độc lập toàn sàn.
            </small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Mã Voucher (Code) *
              </label>
              <input
                type="text"
                required
                maxLength={50}
                className="form-control"
                style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}
                value={couponForm.code}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    code: e.target.value.toUpperCase().replace(/\s+/g, ''),
                  })
                }
                placeholder="VD: SALE10, FREESHIP..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Loại giảm giá *
              </label>
              <select
                className="form-control"
                value={couponForm.discountType}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT',
                  })
                }
              >
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (VND)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                {couponForm.discountType === 'PERCENTAGE'
                  ? 'Mức giảm (%) (1-100) *'
                  : 'Số tiền giảm (VND) *'}
              </label>
              <input
                type="number"
                required
                min={1}
                max={couponForm.discountType === 'PERCENTAGE' ? 100 : undefined}
                step={couponForm.discountType === 'PERCENTAGE' ? 1 : 1000}
                className="form-control"
                value={couponForm.discountValue}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Đơn hàng tối thiểu (VND) *
              </label>
              <input
                type="number"
                required
                min={0}
                step={10000}
                className="form-control"
                value={couponForm.minOrderAmount}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Giới hạn lượt sử dụng
              </label>
              <input
                type="number"
                min={1}
                className="form-control"
                placeholder="Để trống = Không giới hạn"
                value={couponForm.usageLimit}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    usageLimit: e.target.value ? Number(e.target.value) : '',
                  })
                }
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Trạng thái
              </label>
              <select
                className="form-control"
                value={couponForm.status}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    status: e.target.value as 'ACTIVE' | 'INACTIVE',
                  })
                }
              >
                <option value="ACTIVE">ACTIVE (Kích hoạt)</option>
                <option value="INACTIVE">INACTIVE (Vô hiệu)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Ngày bắt đầu
              </label>
              <input
                type="date"
                className="form-control"
                value={couponForm.startAt}
                onChange={(e) => setCouponForm({ ...couponForm, startAt: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Ngày hết hạn
              </label>
              <input
                type="date"
                className="form-control"
                value={couponForm.endAt}
                onChange={(e) => setCouponForm({ ...couponForm, endAt: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              onClick={() => setShowCouponModal(false)}
            >
              Huỷ
            </button>
            <button type="submit" className="nx-btn nx-btn-primary">
              {selectedCoupon ? 'Lưu thay đổi' : 'Lưu mã giảm giá'}
            </button>
          </div>
        </div>
      </form>
    </AdminModal>
  );
}
