import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardTable(model: ReturnType<typeof useAdminDashboard>) {
  const { recentOrders, formatCurrency } = model;
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
                    {recentOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td>
                          <span style={{ fontWeight: 600, color: '#315bf4' }}>{ord.orderNumber}</span>
                        </td>
                        <td>
                          <div>{ord.buyerName || ((ord as any).buyerId ? `ID: ${(ord as any).buyerId.slice(0, 8)}...` : 'Khách mua')}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(ord.totalAmount)}</td>
                        <td>
                          <span
                            className={`nx-badge ${
                              ord.status === 'COMPLETED'
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
                    ))}
                  </tbody>
                </table>
  );
}
