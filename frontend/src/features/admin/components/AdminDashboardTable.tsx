import type { useAdminDashboard } from '../hooks/useAdminDashboard';

const orderLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy',
};

export function AdminDashboardTable({ recentOrders, formatCurrency, loading, ordersError }: ReturnType<typeof useAdminDashboard>) {
  return (
    <table className="nx-admin-table">
      <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
      <tbody>
        {loading || ordersError || recentOrders.length === 0 ? (
          <tr><td colSpan={4} className="nx-admin-empty" role="status">
            {loading ? 'Đang tải đơn hàng…' : ordersError ? 'Chưa tải được danh sách đơn hàng. Vui lòng thử làm mới.' : 'Chưa có đơn hàng.'}
          </td></tr>
        ) : recentOrders.map(order => (
          <tr key={order.id}>
            <td><strong>{order.orderNumber}</strong></td>
            <td>{order.buyerName || (order.buyerId ? `ID: ${order.buyerId.slice(0, 8)}…` : 'Chưa có thông tin')}</td>
            <td className="nx-admin-amount">{formatCurrency(order.totalAmount)}</td>
            <td><span className={`nx-badge ${order.status === 'COMPLETED' ? 'nx-badge-success' : order.status === 'SHIPPING' ? 'nx-badge-primary' : order.status === 'CANCELLED' ? 'nx-badge-danger' : 'nx-badge-warning'}`}>
              {orderLabels[order.status] ?? order.status}
            </span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
