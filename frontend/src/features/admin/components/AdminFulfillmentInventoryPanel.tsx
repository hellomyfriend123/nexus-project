import { AdminFulfillmentTable } from './AdminFulfillmentTable';
import type { useAdminFulfillment } from '../hooks/useAdminFulfillment';

export function AdminFulfillmentInventoryPanel(model: ReturnType<typeof useAdminFulfillment>) {
  const { activeTab, warehouseFilter, setWarehouseFilter, stockStatusFilter, setStockStatusFilter, warehouses } = model;
  return (
    <>
          {activeTab === 'inventory' && (
            <div className="nx-admin-card">
              <div className="nx-filter-bar">
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả kho lưu trữ</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>

                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả mức tồn</option>
                  <option value="IN_STOCK">IN_STOCK (Còn hàng)</option>
                  <option value="LOW_STOCK">LOW_STOCK (Sắp hết)</option>
                  <option value="OUT_OF_STOCK">OUT_OF_STOCK (Hết hàng)</option>
                </select>
              </div>

              <div className="nx-table-container">
                <AdminFulfillmentTable {...model} />
              </div>
            </div>
          )}
        </>
  );
}
