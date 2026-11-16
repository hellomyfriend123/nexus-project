import { useState, useEffect, useCallback } from 'react';
import AdminModal from '../components/AdminModal';
import { adminUsersApi } from '../../../services/api/adminApi';
import type {
  AdminUserDetails,
  UserStatus,
} from '../../../features/admin/types/admin.types';

export interface DetailedAdminUser {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  phone?: string;
  phoneNumber?: string;
  identityNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  role?: string;
  roles?: string[];
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
  totalOrders?: number;
  totalSpent?: number;
  notes?: string;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<DetailedAdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUsingRealApi, setIsUsingRealApi] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<DetailedAdminUser | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<UserStatus>('ACTIVE');
  const [actionLoading, setActionLoading] = useState(false);

  // Helper tìm kiếm số điện thoại linh hoạt (hỗ trợ vài số đầu, số bất kỳ, số đầy đủ, 0xxx vs 84xxx)
  const isPhoneMatch = (userPhoneStr?: string, queryStr?: string) => {
    if (!userPhoneStr || !queryStr) return false;
    const cleanUser = userPhoneStr.replace(/\D/g, '');
    const cleanQuery = queryStr.replace(/\D/g, '');
    if (!cleanQuery) return false;
    if (cleanUser.includes(cleanQuery)) return true;
    const userNorm = cleanUser.startsWith('84') ? '0' + cleanUser.slice(2) : cleanUser;
    const queryNorm = cleanQuery.startsWith('84') ? '0' + cleanQuery.slice(2) : cleanQuery;
    return userNorm.includes(queryNorm) || cleanUser.includes(queryNorm);
  };

  // Fetch users directly from REST API and enrich details (phone, roles)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const trimmedKeyword = searchKeyword.trim();
      const hasDigits = /\d/.test(trimmedKeyword);

      // Backend UserRepository.java chỉ lọc LIKE trên email, username, fullName (KHÔNG lọc trên phone).
      // Nếu gửi từ khóa có chứa số (như SĐT) lên backend thì backend sẽ trả về mảng rỗng.
      // Do đó, khi tìm theo số điện thoại, frontend gọi danh sách đầy đủ (size: 100) và tự lọc trên client.
      const response = await adminUsersApi.list({
        keyword: hasDigits ? undefined : (trimmedKeyword || undefined),
        status: statusFilter === 'ALL' ? undefined : (statusFilter as UserStatus),
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        size: 100,
      });

      if (response && Array.isArray(response.content)) {
        // Lấy chi tiết để có số điện thoại (phone), vai trò (roles) chính xác từ backend
        const enrichedList = await Promise.all(
          response.content.map(async (u: any) => {
            try {
              const detail = await adminUsersApi.getById(u.id);
              return {
                ...u,
                ...detail,
                phone: detail.phone || u.phone || u.phoneNumber,
                phoneNumber: detail.phone || u.phoneNumber || u.phone,
                roles: detail.roles || u.roles || (u.role ? [u.role] : []),
              };
            } catch {
              return {
                ...u,
                roles: u.roles || (u.role ? [u.role] : []),
                phone: u.phone || u.phoneNumber,
              };
            }
          }),
        );

        // Lọc toàn diện: Tìm theo Số điện thoại (vài số đầu, số bất kỳ, số đầy đủ), họ tên, email, username
        let finalUsers = enrichedList;
        if (trimmedKeyword) {
          const lowerTerm = trimmedKeyword.toLowerCase();
          finalUsers = enrichedList.filter((u: any) => {
            const userPhone = (u.phone || u.phoneNumber || '').toString();
            const phoneMatched = isPhoneMatch(userPhone, trimmedKeyword);
            const nameMatched = (u.fullName || '').toLowerCase().includes(lowerTerm);
            const emailMatched = (u.email || '').toLowerCase().includes(lowerTerm);
            const usernameMatched = (u.username || '').toLowerCase().includes(lowerTerm);
            return phoneMatched || nameMatched || emailMatched || usernameMatched;
          });
        }

        setUsers(finalUsers as DetailedAdminUser[]);
        setIsUsingRealApi(true);
      } else {
        setUsers([]);
      }
    } catch {
      setIsUsingRealApi(false);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, statusFilter, roleFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchUsers]);

  // Task U-2: View user details via API
  const handleViewDetails = async (user: DetailedAdminUser) => {
    setSelectedUser(user);
    try {
      const freshData = await adminUsersApi.getById(user.id);
      if (freshData) {
        setSelectedUser({
          ...user,
          ...freshData,
          phone: (freshData as any).phone || user.phone || user.phoneNumber,
          phoneNumber: (freshData as any).phone || user.phoneNumber || user.phone,
          roles: (freshData as any).roles || user.roles,
        } as DetailedAdminUser);
      }
    } catch {
      // Use existing user data if backend endpoint fails
    }
  };

  // Task U-3: Change status via API
  const handleOpenStatusModal = (user: DetailedAdminUser) => {
    setSelectedUser(user);
    setTargetStatus(user.status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminUsersApi.updateStatus(selectedUser.id, targetStatus);
      alert(`Đã cập nhật trạng thái người dùng ${selectedUser.fullName} thành ${targetStatus}!`);
      setShowStatusModal(false);
      fetchUsers();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể cập nhật trạng thái người dùng:\n${errorMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="nx-page-header">
        <div>
          <h1 className="nx-page-title">Quản lý Người dùng (FR-04, FR-52)</h1>
          <p className="nx-page-subtitle">
            Kết nối REST API: <code>/api/v1/admin/users</code>
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
          onClick={() => fetchUsers()}
          disabled={loading}
        >
          <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Làm mới
        </button>
      </div>

      <div className="nx-admin-card">
        {/* Search & Filter Bar */}
        <div className="nx-filter-bar">
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: '260px', paddingRight: searchKeyword ? '28px' : '12px' }}
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Xóa tìm kiếm"
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE (Hoạt động)</option>
            <option value="INACTIVE">INACTIVE (Chưa kích hoạt)</option>
            <option value="BANNED">BANNED (Bị cấm / Khoá)</option>
          </select>

          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="ALL">Tất cả vai trò</option>
            <option value="BUYER">BUYER (Người mua)</option>
            <option value="SELLER">SELLER (Người bán)</option>
            <option value="ADMIN">ADMIN (Quản trị viên)</option>
            <option value="ADMINISTRATOR">ADMINISTRATOR (Quản trị viên)</option>
          </select>

          <span style={{ fontSize: '13px', color: '#64748b', marginLeft: 'auto' }}>
            {loading ? 'Đang tải dữ liệu...' : `Hiển thị ${users.length} người dùng`}
          </span>
        </div>

        {/* Users Table */}
        <div className="nx-table-container">
          <table className="nx-admin-table">
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    {loading
                      ? 'Đang tải dữ liệu từ máy chủ...'
                      : searchKeyword
                        ? `Không tìm thấy người dùng nào khớp với "${searchKeyword}".`
                        : 'Không tìm thấy người dùng nào phù hợp bộ lọc.'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{user.fullName}</span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {user.phone || user.phoneNumber ? (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>
                          <i className="bi bi-telephone-fill me-1" style={{ fontSize: '11px' }}></i>
                          {user.phone || user.phoneNumber}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                          Chưa cập nhật
                        </span>
                      )}
                    </td>
                    <td>
                      {Array.isArray(user.roles) && user.roles.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {user.roles.map((r) => (
                            <span
                              key={r}
                              className={`nx-badge ${
                                r === 'ADMIN' || r === 'ADMINISTRATOR'
                                  ? 'nx-badge-danger'
                                  : r === 'SELLER'
                                    ? 'nx-badge-warning'
                                    : 'nx-badge-primary'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : user.role ? (
                        <span
                          className={`nx-badge ${
                            user.role === 'ADMINISTRATOR' || user.role === 'ADMIN'
                              ? 'nx-badge-danger'
                              : user.role === 'SELLER'
                                ? 'nx-badge-warning'
                                : 'nx-badge-primary'
                          }`}
                        >
                          {user.role}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`nx-badge ${
                          user.status === 'ACTIVE'
                            ? 'nx-badge-success'
                            : user.status === 'BANNED'
                              ? 'nx-badge-danger'
                              : 'nx-badge-secondary'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="nx-btn nx-btn-outline nx-btn-sm"
                          onClick={() => handleViewDetails(user)}
                          title="Xem chi tiết (GET /api/v1/admin/users/{id})"
                        >
                          <i className="bi bi-eye"></i> Xem
                        </button>
                        <button
                          type="button"
                          className="nx-btn nx-btn-primary nx-btn-sm"
                          onClick={() => handleOpenStatusModal(user)}
                          title="Đổi trạng thái (PATCH /api/v1/admin/users/{id}/status)"
                        >
                          <i className="bi bi-shield-lock"></i> Đổi trạng thái
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

      {/* User Details Modal (Task U-2) */}
      <AdminModal
        isOpen={Boolean(selectedUser && !showStatusModal)}
        onClose={() => setSelectedUser(null)}
        title="Chi tiết tài khoản người dùng (GET /api/v1/admin/users/{id})"
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#315bf4',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 700,
                }}
              >
                {selectedUser.fullName.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{selectedUser.fullName}</h3>
                <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                  ID: <code>{selectedUser.id}</code>
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div>
                <strong>Tên đăng nhập:</strong> {selectedUser.username || selectedUser.email}
              </div>
              <div>
                <strong>Điện thoại:</strong>{' '}
                {selectedUser.phone || selectedUser.phoneNumber ? (
                  <strong style={{ color: '#16a34a' }}>
                    <i className="bi bi-telephone-fill me-1"></i>
                    {selectedUser.phone || selectedUser.phoneNumber}
                  </strong>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>
                )}
              </div>
              <div>
                <strong>Vai trò:</strong>{' '}
                {Array.isArray(selectedUser.roles) && selectedUser.roles.length > 0 ? (
                  <span style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap' }}>
                    {selectedUser.roles.map((r) => (
                      <span
                        key={r}
                        className={`nx-badge ${
                          r === 'ADMIN' || r === 'ADMINISTRATOR'
                            ? 'nx-badge-danger'
                            : r === 'SELLER'
                              ? 'nx-badge-warning'
                              : 'nx-badge-primary'
                        }`}
                      >
                        {r}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="nx-badge nx-badge-primary">{selectedUser.role || 'BUYER'}</span>
                )}
              </div>
              <div>
                <strong>Trạng thái:</strong>{' '}
                <span
                  className={`nx-badge ${
                    selectedUser.status === 'ACTIVE'
                      ? 'nx-badge-success'
                      : selectedUser.status === 'BANNED'
                        ? 'nx-badge-danger'
                        : 'nx-badge-secondary'
                  }`}
                >
                  {selectedUser.status}
                </span>
              </div>
              <div>
                <strong>Số CMND/CCCD:</strong> {selectedUser.identityNumber || 'Chưa cung cấp'}
              </div>
              <div>
                <strong>Ngày tạo:</strong>{' '}
                {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
              </div>
              <div>
                <strong>Cập nhật lần cuối:</strong>{' '}
                {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('vi-VN') : 'Theo hệ thống'}
              </div>
            </div>

            {selectedUser.address && (
              <div style={{ fontSize: '13px' }}>
                <strong>Địa chỉ:</strong> {selectedUser.address}
              </div>
            )}

            {selectedUser.notes && (
              <div style={{ fontSize: '13px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                <strong>Ghi chú hệ thống:</strong> {selectedUser.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                className="nx-btn nx-btn-primary"
                onClick={() => {
                  setShowStatusModal(true);
                }}
              >
                Cập nhật trạng thái
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Change Status Modal (Task U-3) */}
      <AdminModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Kích hoạt / Vô hiệu hoá / Khoá tài khoản (PATCH /status)"
      >
        {selectedUser && (
          <div>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>
              Thay đổi trạng thái cho tài khoản: <strong>{selectedUser.fullName}</strong> (
              {selectedUser.email})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  backgroundColor: targetStatus === 'ACTIVE' ? '#eff6ff' : '#fff',
                }}
              >
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={targetStatus === 'ACTIVE'}
                  onChange={() => setTargetStatus('ACTIVE')}
                />
                <div>
                  <strong style={{ color: '#059669' }}>ACTIVE (Kích hoạt)</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Người dùng có thể đăng nhập, đặt giá đấu và mua sắm bình thường.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  backgroundColor: targetStatus === 'INACTIVE' ? '#eff6ff' : '#fff',
                }}
              >
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={targetStatus === 'INACTIVE'}
                  onChange={() => setTargetStatus('INACTIVE')}
                />
                <div>
                  <strong style={{ color: '#d97706' }}>INACTIVE (Vô hiệu hoá tạm thời)</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Tạm dừng hoạt động tài khoản cho đến khi được mở lại.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  backgroundColor: targetStatus === 'BANNED' ? '#eff6ff' : '#fff',
                }}
              >
                <input
                  type="radio"
                  name="status"
                  value="BANNED"
                  checked={targetStatus === 'BANNED'}
                  onChange={() => setTargetStatus('BANNED')}
                />
                <div>
                  <strong style={{ color: '#dc2626' }}>BANNED (Khoá / Cấm tài khoản)</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Khoá do vi phạm chính sách sàn hoặc huỷ bid không thanh toán.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                className="nx-btn nx-btn-outline"
                disabled={actionLoading}
                onClick={() => setShowStatusModal(false)}
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                className="nx-btn nx-btn-primary"
                disabled={actionLoading}
                onClick={handleUpdateStatus}
              >
                {actionLoading ? 'Đang cập nhật...' : 'Lưu thay đổi (PATCH /status)'}
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

export default AdminUsersPage;
