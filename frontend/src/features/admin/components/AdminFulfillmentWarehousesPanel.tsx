import type { useAdminFulfillment } from '../hooks/useAdminFulfillment';

export function AdminFulfillmentWarehousesPanel(model: ReturnType<typeof useAdminFulfillment>) {
  const { activeTab, warehouses, handleOpenCreateWarehouse, handleOpenEditWarehouse, handleToggleWarehouseStatus } = model;
  return (
    <>
          {activeTab === 'warehouses' && (
            <div className="nx-admin-card">
              <div className="nx-admin-card-header">
                <h2 className="nx-admin-card-title">Danh sách Trung tâm Vận hành & Kho hàng (FR-55)</h2>
                <button
                  type="button"
                  className="nx-btn nx-btn-primary nx-btn-sm"
                  onClick={handleOpenCreateWarehouse}
                >
                  <i className="bi bi-plus-lg"></i> Thêm kho mới
                </button>
              </div>
              <div className="nx-table-container">
                <table className="nx-admin-table">
                  <thead>
                    <tr>
                      <th>Tên kho / Mã</th>
                      <th>Địa chỉ kho hàng</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                          Chưa có kho hàng nào trong hệ thống.
                        </td>
                      </tr>
                    ) : (
                      warehouses.map((wh) => (
                        <tr key={wh.id}>
                          <td>
                            <div>
                              <strong>{wh.name}</strong>
                            </div>
                            <code style={{ color: '#315bf4' }}>{wh.code}</code>
                          </td>
                          <td>
                            <div>{wh.address || '—'}</div>
                          </td>
                          <td>
                            <span
                              className={`nx-badge ${
                                wh.status === 'ACTIVE' ? 'nx-badge-success' : 'nx-badge-secondary'
                              }`}
                            >
                              {wh.status}
                            </span>
                          </td>
                          <td>
                            {wh.createdAt ? new Date(wh.createdAt).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="nx-btn nx-btn-outline nx-btn-sm"
                                onClick={() => handleOpenEditWarehouse(wh)}
                                title="Sửa thông tin kho (PUT /api/v1/admin/fulfillment/warehouses/{id})"
                              >
                                <i className="bi bi-pencil"></i> Sửa
                              </button>
                              <button
                                type="button"
                                className={`nx-btn nx-btn-sm ${
                                  wh.status === 'ACTIVE' ? 'nx-btn-danger' : 'nx-btn-primary'
                                }`}
                                onClick={() => handleToggleWarehouseStatus(wh.id, wh.status)}
                                title="Bật/Ngừng hoạt động kho (FR-55)"
                              >
                                {wh.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'}
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
          )}
        </>
  );
}
