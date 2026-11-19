import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceTable(model: ReturnType<typeof useAdminCommerce>) {
  const { handleViewOrderDetails, handleCancelOrder, formatCurrency, filteredOrders } = model;
  return (
    <table className="nx-admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Người mua (Buyer)</th>
                      <th>Người bán (Seller)</th>
                      <th>Phân loại</th>
                      <th>Số lượng</th>
                      <th>Tổng thanh toán</th>
                      <th>Trạng thái</th>
                      <th>Ngày đặt</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                          <i className="bi bi-inbox" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                          Không tìm thấy đơn hàng nào phù hợp bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td>
                            <strong style={{ color: '#315bf4' }}>{ord.orderNumber}</strong>
                          </td>
                          <td>
                            <div>
                              <strong>{ord.receiverName || ord.buyerName || 'Khách mua'}</strong>
                            </div>
                            {ord.buyerId && (
                              <small
                                style={{ color: '#64748b', fontFamily: 'monospace' }}
                                title={`Buyer UUID: ${ord.buyerId}`}
                              >
                                ID: {ord.buyerId.slice(0, 8)}...
                              </small>
                            )}
                            {ord.receiverPhone && (
                              <div style={{ fontSize: '11px', color: '#16a34a' }}>
                                <i className="bi bi-telephone me-1"></i>
                                {ord.receiverPhone}
                              </div>
                            )}
                          </td>
                          <td>
                            {ord.sellerId ? (
                              <span
                                className="nx-badge nx-badge-secondary"
                                title={`Seller UUID: ${ord.sellerId}`}
                                style={{ fontFamily: 'monospace', fontSize: '11px' }}
                              >
                                <i className="bi bi-shop me-1"></i>
                                {ord.sellerId.slice(0, 8)}...
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>-</span>
                            )}
                          </td>
                          <td>
                            <span className="nx-badge nx-badge-secondary">
                              {ord.orderType || 'REGULAR'}
                            </span>
                          </td>
                          <td>
                            <strong>{ord.itemCount ?? ord.itemsCount ?? 1}</strong> món
                          </td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>
                            {formatCurrency(ord.totalAmount)}
                          </td>
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
                          <td>{new Date(ord.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="nx-btn nx-btn-outline nx-btn-sm"
                                onClick={() => handleViewOrderDetails(ord)}
                                title="Xem chi tiết đơn hàng"
                              >
                                <i className="bi bi-eye"></i> Xem
                              </button>
                              {ord.status !== 'CANCELLED' && ord.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  className="nx-btn nx-btn-danger nx-btn-sm"
                                  onClick={() => handleCancelOrder(ord.id)}
                                  title="Huỷ đơn hàng"
                                >
                                  <i className="bi bi-x-circle"></i> Huỷ
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
