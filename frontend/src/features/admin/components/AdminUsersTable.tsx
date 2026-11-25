import type { useAdminUsers } from '../hooks/useAdminUsers';

export function AdminUsersTable(model: ReturnType<typeof useAdminUsers>) {
  const { users, loading, searchKeyword, handleViewDetails, handleOpenStatusModal } = model;
  return (
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
  );
}
