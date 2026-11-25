import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceHeader(model: ReturnType<typeof useAdminCommerce>) {
  const { loading, isUsingRealApi, loadData } = model;
  return (
    <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Quản trị Commerce (FR-25, 46, 47, 56, 58)</h1>
              <p className="nx-page-subtitle">
                Kết nối REST API: <code>/api/v1/admin/commerce/*</code>
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
              onClick={() => loadData()}
              disabled={loading}
            >
              <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Làm mới
            </button>
          </div>
  );
}
