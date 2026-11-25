import type { useAdminUsers } from '../hooks/useAdminUsers';

export function AdminUsersHeader({ loading, error, fetchUsers }: ReturnType<typeof useAdminUsers>) {
  return (
    <div className="nx-page-header">
      <div>
        <h1 className="nx-page-title">Quản lý Người dùng</h1>
        <p className="nx-page-subtitle">
          Quản lý danh sách, trạng thái và thông tin tài khoản người dùng trên sàn.
          {error && !loading && (
            <span
              style={{
                marginLeft: '8px',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                fontWeight: 600,
              }}
            >
              Chưa thể tải dữ liệu
            </span>
          )}
        </p>
      </div>
      <button
        type="button"
        className="nx-btn nx-btn-outline"
        onClick={() => void fetchUsers()}
        disabled={loading}
      >
        <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} aria-hidden="true"></i> Làm mới
      </button>
    </div>
  );
}
