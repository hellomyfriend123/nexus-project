import type { useAdminUsers } from '../hooks/useAdminUsers';

export function AdminUsersHeader({ loading, fetchUsers }: ReturnType<typeof useAdminUsers>) {
  return (
    <div className="nx-page-header">
      <div>
        <h1 className="nx-page-title">Người dùng</h1>
        <p className="nx-page-subtitle">Tra cứu tài khoản và quản lý trạng thái truy cập.</p>
      </div>
      <button type="button" className="nx-btn nx-btn-outline" onClick={() => void fetchUsers()} disabled={loading}>
        <i className="bi bi-arrow-clockwise" aria-hidden="true" /> {loading ? 'Đang tải…' : 'Làm mới'}
      </button>
    </div>
  );
}
