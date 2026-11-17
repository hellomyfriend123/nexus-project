import type { useAdminCatalog } from '../hooks/useAdminCatalog';

export function AdminCatalogHeader(model: ReturnType<typeof useAdminCatalog>) {
  const { loading, isUsingRealApi, loadData } = model;
  return (
    <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Quản trị Catalog (FR-08, 09, 45, 53, 54, 59)</h1>
              <p className="nx-page-subtitle">
                Kết nối REST API: <code>/api/v1/admin/catalog/*</code>
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
