import type { useAdminCatalog } from '../hooks/useAdminCatalog';

export function AdminCatalogProductsPanel(model: ReturnType<typeof useAdminCatalog>) {
  const { activeTab, categories, productKeyword, setProductKeyword, productCategoryFilter, setProductCategoryFilter, handleToggleProductStatus, handleDeleteProduct, filteredProducts, formatCurrency } = model;
  return (
    <>
          {activeTab === 'products' && (
            <div className="nx-admin-card">
              <div className="nx-filter-bar">
                <input
                  type="text"
                  placeholder="Tìm theo tên sản phẩm..."
                  value={productKeyword}
                  onChange={(e) => setProductKeyword(e.target.value)}
                  style={{ width: '280px' }}
                />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="nx-table-container">
                <table className="nx-admin-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Danh mục</th>
                      <th>Giá niêm yết</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                          Không có sản phẩm nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const displayPrice = (p as any).basePrice ?? p.price ?? 0;
                        return (
                          <tr key={p.id}>
                            <td>
                              <div>
                                <strong>{p.name}</strong>
                              </div>
                              <code style={{ fontSize: '11px', color: '#64748b' }}>
                                ID: {p.id.slice(0, 8)}...
                              </code>
                            </td>
                            <td>{p.categoryName || 'Mặc định'}</td>
                            <td style={{ fontWeight: 600, color: '#0f172a' }}>
                              {formatCurrency(displayPrice)}
                            </td>
                            <td>
                              <span
                                className={`nx-badge ${
                                  p.status === 'ACTIVE'
                                    ? 'nx-badge-success'
                                    : p.status === 'INACTIVE'
                                      ? 'nx-badge-danger'
                                      : 'nx-badge-secondary'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="nx-btn nx-btn-outline nx-btn-sm"
                                  onClick={() => handleToggleProductStatus(p.id, p.status)}
                                  title="Đổi trạng thái ACTIVE/INACTIVE"
                                >
                                  <i className="bi bi-arrow-repeat"></i> Trạng thái
                                </button>
                                <button
                                  type="button"
                                  className="nx-btn nx-btn-danger nx-btn-sm"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  title="Xoá mềm sản phẩm"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
  );
}
