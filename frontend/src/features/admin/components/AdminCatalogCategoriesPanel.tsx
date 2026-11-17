import { AdminCatalogTable } from './AdminCatalogTable';
import type { useAdminCatalog } from '../hooks/useAdminCatalog';

export function AdminCatalogCategoriesPanel(model: ReturnType<typeof useAdminCatalog>) {
  const { activeTab, categoryStatusFilter, setCategoryStatusFilter, handleOpenCategoryCreate } = model;
  return (
    <>
          {activeTab === 'categories' && (
            <div className="nx-admin-card">
              <div className="nx-admin-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 className="nx-admin-card-title">Danh sách Danh mục hàng hoá (FR-09, FR-54)</h2>
                  <select
                    value={categoryStatusFilter}
                    onChange={(e) => setCategoryStatusFilter(e.target.value)}
                    style={{
                      fontSize: '12.5px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                    }}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
                    <option value="INACTIVE">INACTIVE (Đã xoá mềm / Ngừng)</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="nx-btn nx-btn-primary nx-btn-sm"
                  onClick={handleOpenCategoryCreate}
                >
                  <i className="bi bi-plus-lg"></i> Thêm danh mục mới
                </button>
              </div>
              <div className="nx-table-container">
                <AdminCatalogTable {...model} />
              </div>
            </div>
          )}
        </>
  );
}
