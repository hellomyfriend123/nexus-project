import type { useAdminCatalog } from '../hooks/useAdminCatalog';

export function AdminCatalogTable(model: ReturnType<typeof useAdminCatalog>) {
  const { categories, handleOpenCategoryEdit, handleDeleteCategory } = model;
  return (
    <table className="nx-admin-table">
                  <thead>
                    <tr>
                      <th>Tên danh mục</th>
                      <th>Mô tả</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                          Không có danh mục nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat) => (
                        <tr key={cat.id}>
                          <td>
                            <strong>{cat.name}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              ID: <code>{cat.id.slice(0, 8)}...</code>
                            </div>
                          </td>
                          <td>{cat.description || '—'}</td>
                          <td>
                            <span
                              className={`nx-badge ${
                                (cat.status || 'ACTIVE') === 'ACTIVE'
                                  ? 'nx-badge-success'
                                  : 'nx-badge-secondary'
                              }`}
                            >
                              {(cat.status || 'ACTIVE') === 'ACTIVE'
                                ? 'ACTIVE (Hoạt động)'
                                : 'INACTIVE (Đã xoá mềm)'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="nx-btn nx-btn-outline nx-btn-sm"
                                onClick={() => handleOpenCategoryEdit(cat)}
                                title="Cập nhật danh mục (PUT /api/v1/admin/catalog/categories/{id})"
                              >
                                <i className="bi bi-pencil"></i> Sửa
                              </button>
                              {(cat.status || 'ACTIVE') === 'ACTIVE' && (
                                <button
                                  type="button"
                                  className="nx-btn nx-btn-danger nx-btn-sm"
                                  onClick={() => handleDeleteCategory(cat)}
                                  title="Xoá mềm danh mục (DELETE /api/v1/admin/catalog/categories/{id})"
                                >
                                  <i className="bi bi-trash"></i> Xoá
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
  );
}
