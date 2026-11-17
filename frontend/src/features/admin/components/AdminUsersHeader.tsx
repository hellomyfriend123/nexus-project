import type { useAdminUsers } from '../hooks/useAdminUsers';

export function AdminUsersHeader(model: ReturnType<typeof useAdminUsers>) {
  const { loading, isUsingRealApi, fetchUsers } = model;
  return (
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
  );
}
