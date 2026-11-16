import { useState, useEffect } from 'react';
import { sellerProfileApi } from '../sellerApi';
import type { SellerProfileResponse } from '../sellerApi';
import { getSession } from '../../../features/auth/services/auth.api';

export function SellerProfilePage() {
  const session = getSession();

  const [profile, setProfile] = useState<SellerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    gender: 'OTHER' as 'MALE' | 'FEMALE' | 'OTHER',
  });

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sellerProfileApi.getProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || '',
        phone: data.phone || '',
        address: data.address || '',
        gender: data.gender || 'OTHER',
      });
    } catch (err: any) {
      setError(err.message || 'Không thể tải hồ sơ Seller từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await sellerProfileApi.updateProfile({
        fullName: formData.fullName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        gender: formData.gender,
      });
      setProfile(updated);
      setIsEditing(false);
      setSuccessMsg('Cập nhật hồ sơ Seller thành công qua API PUT /api/v1/seller/profile!');
    } catch (err: any) {
      setError(err.message || 'Cập nhật hồ sơ thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="nx-seller-page-header">
        <div>
          <h2 className="nx-seller-page-title">Hồ Sơ Người Bán & Gian Hàng</h2>
          <p className="nx-seller-page-desc">
            Dữ liệu thật kết nối trực tiếp Backend Nexus (API Profile Seller: FR-03)
          </p>
        </div>

        <div className="d-flex gap-2">
          {/* API: GET /api/v1/seller/profile */}
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-1"
            onClick={loadProfile}
            disabled={loading}
            title="Tải lại hồ sơ từ máy chủ qua GET /api/v1/seller/profile"
          >
            <span className="nx-api-badge get">GET</span>
            <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-arrow-clockwise'}`}></i>
            <span>{loading ? 'Đang tải...' : 'Tải lại (FR-03)'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-check-circle-fill"></i>
          <div>{successMsg}</div>
        </div>
      )}

      {loading && !profile ? (
        <div className="nx-seller-card text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-2 mb-0">Đang tải hồ sơ Seller từ máy chủ...</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* Left Column: Summary Card */}
          <div className="col-12 col-lg-4">
            <div className="nx-seller-card text-center p-4">
              <div
                className="rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
                style={{ width: '84px', height: '84px', fontSize: '36px' }}
              >
                <i className="bi bi-shop"></i>
              </div>
              <h4 className="fw-bold m-0">{profile?.fullName || session?.fullName || 'Gian hàng Seller'}</h4>
              <div className="mt-2 mb-3">
                <span className={`badge ${profile?.status === 'ACTIVE' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning'} px-2 py-1`}>
                  <i className="bi bi-patch-check-fill me-1"></i> Trạng thái: {profile?.status || 'ACTIVE'}
                </span>
              </div>

              <div className="border-top pt-3 text-start">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Tên đăng nhập:</span>
                  <span className="font-monospace fw-semibold">{profile?.username || session?.username || '-'}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Email liên hệ:</span>
                  <span className="font-monospace text-muted small">{profile?.email || session?.email}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Số điện thoại:</span>
                  <span className="fw-semibold">{profile?.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Ngày tham gia:</span>
                  <span className="text-muted small">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Edit Form */}
          <div className="col-12 col-lg-8">
            <div className="nx-seller-card">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                <div>
                  <h5 className="fw-bold m-0">Thông tin chi tiết Hồ sơ (FR-03)</h5>
                  <small className="text-muted">Gắn kết API PUT /api/v1/seller/profile</small>
                </div>
                {!isEditing ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="bi bi-pencil-square"></i>
                    <span>Chỉnh sửa hồ sơ</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    onClick={() => {
                      if (profile) {
                        setFormData({
                          fullName: profile.fullName || '',
                          phone: profile.phone || '',
                          address: profile.address || '',
                          gender: profile.gender || 'OTHER',
                        });
                      }
                      setIsEditing(false);
                    }}
                  >
                    Hủy bỏ
                  </button>
                )}
              </div>

              <form onSubmit={handleSave}>
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Họ và tên / Tên chủ shop (*)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.fullName}
                      disabled={!isEditing || submitting}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Số điện thoại liên hệ</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      disabled={!isEditing || submitting}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email tài khoản (Cố định, không đổi tại đây)</label>
                  <input
                    type="email"
                    className="form-control bg-light"
                    value={profile?.email || ''}
                    disabled
                  />
                  <small className="text-muted">Theo quy tắc bảo mật Backend Nexus, email là định danh không đổi tại FR-03.</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Địa chỉ kho hàng / Trụ sở kinh doanh</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    disabled={!isEditing || submitting}
                    placeholder="Nhập địa chỉ của bạn..."
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Giới tính</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    disabled={!isEditing || submitting}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  >
                    <option value="MALE">Nam (MALE)</option>
                    <option value="FEMALE">Nữ (FEMALE)</option>
                    <option value="OTHER">Khác (OTHER)</option>
                  </select>
                </div>

                {isEditing && (
                  <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setIsEditing(false)}
                      disabled={submitting}
                    >
                      Hủy
                    </button>

                    {/* API: PUT /api/v1/seller/profile */}
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={submitting}
                    >
                      <span className="nx-api-badge put">PUT</span>
                      <i className="bi bi-check-lg"></i>
                      <span>{submitting ? 'Đang lưu...' : 'Lưu hồ sơ thật (FR-03)'}</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerProfilePage;
