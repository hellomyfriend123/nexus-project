import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardTable({
  recentOrders,
  formatCurrency,
  loading,
  ordersError,
}: ReturnType<typeof useAdminDashboard>) {
  return (
    <table className="nx-admin-table">
      <thead>
        <tr>
          <th>Mã đơn</th>
          <th>Khách hàng</th>
          <th>Tổng tiền</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {loading || ordersError || recentOrders.length === 0 ? (
          <tr>
            <td colSpan={4} className="nx-admin-empty" role="status">
              {loading
                ? 'Đang tải đơn hàng…'
                : ordersError
                  ? 'Chưa tải được danh sách đơn hàng. Vui lòng thử làm mới.'
                  : 'Chưa có đơn hàng.'}
            </td>
          </tr>
        ) : (
          recentOrders.map((ord) => (
            <tr key={ord.id}>
              <td>
                <span style={{ fontWeight: 600, color: '#315bf4' }}>{ord.orderNumber}</span>
              </td>
              <td>
                <div>
                  {ord.receiverName ||
                    ord.buyerName ||
                    (ord.buyerId ? `ID: ${ord.buyerId.slice(0, 8)}...` : 'Khách mua')}
                </div>
              </td>
              <td className="nx-admin-amount">{formatCurrency(ord.totalAmount)}</td>
              <td>
                <span
                  className={`nx-badge ${
                    ord.status === 'COMPLETED' || (ord.status as string) === 'DELIVERED'
                      ? 'nx-badge-success'
                      : ord.status === 'SHIPPING'
                        ? 'nx-badge-primary'
                        : ord.status === 'CANCELLED'
                          ? 'nx-badge-danger'
                          : 'nx-badge-warning'
                  }`}
                >
                  {ord.status}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
