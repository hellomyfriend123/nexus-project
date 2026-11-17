import { AdminCommerceTable } from './AdminCommerceTable';
import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceOrdersPanel(model: ReturnType<typeof useAdminCommerce>) {
  const { activeTab, orderStatusFilter, setOrderStatusFilter } = model;
  return (
    <>
          {activeTab === 'orders' && (
            <div className="nx-admin-card">
              <div className="nx-filter-bar">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái đơn hàng</option>
                  <option value="PENDING">PENDING (Chờ xác nhận)</option>
                  <option value="CONFIRMED">CONFIRMED (Đã xác nhận)</option>
                  <option value="SHIPPING">SHIPPING (Đang giao hàng)</option>
                  <option value="DELIVERED">DELIVERED (Giao thành công)</option>
                  <option value="CANCELLED">CANCELLED (Đã huỷ)</option>
                </select>
              </div>

              <div className="nx-table-container">
                <AdminCommerceTable {...model} />
              </div>
            </div>
          )}
        </>
  );
}
