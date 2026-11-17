import type { useAdminFulfillment } from '../hooks/useAdminFulfillment';

export function AdminFulfillmentTable(model: ReturnType<typeof useAdminFulfillment>) {
  const { warehouses, filteredInventory } = model;
  return (
    <table className="nx-admin-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm / SKU</th>
                      <th>Kho lưu trữ</th>
                      <th>Thực tồn (On Hand)</th>
                      <th>Đang giữ (Reserved)</th>
                      <th>Khả dụng (Available)</th>
                      <th>Mức cảnh báo</th>
                      <th>Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.productName || (item as any).skuName || 'Sản phẩm'}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            SKU: {item.sku || (item as any).skuCode}
                          </div>
                        </td>
                        <td>{item.warehouseName || warehouses.find((w) => w.id === item.warehouseId)?.name || 'Kho hàng'}</td>
                        <td style={{ fontWeight: 600 }}>{item.quantityOnHand ?? (item as any).totalQuantity ?? 0}</td>
                        <td style={{ color: '#d97706' }}>{item.quantityReserved ?? 0}</td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>
                          {item.quantityAvailable ?? (item as any).availableQuantity ?? 0}
                        </td>
                        <td style={{ color: '#64748b' }}>{item.reorderLevel ?? '—'}</td>
                        <td>
                          <span
                            className={`nx-badge ${
                              item.status === 'IN_STOCK'
                                ? 'nx-badge-success'
                                : item.status === 'LOW_STOCK'
                                  ? 'nx-badge-warning'
                                  : 'nx-badge-danger'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
  );
}
