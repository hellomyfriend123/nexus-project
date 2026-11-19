import { Link } from 'react-router-dom';
import type { SellerHubState } from '../hooks/useSellerHub';
import { formatSellerMoney, orderStatusLabels, sellerOrderFilters } from '../constants/sellerHub.constants';
export default function OrdersTab({ hub }: { hub: SellerHubState }) {
  return <section role="tabpanel" id="hub-panel-orders" aria-labelledby="hub-tab-orders" className="nx-seller-panel">
    <div className="nx-seller-panel-heading"><div><h2>Đơn hàng</h2><p>{hub.pendingOrders} đơn chờ xác nhận.</p></div></div>
    <div className="nx-seller-chips" role="group" aria-label="Lọc đơn hàng">{sellerOrderFilters.map(filter => <button type="button" key={filter.id} className={`nx-seller-chip ${hub.orderFilter === filter.id ? 'is-active' : ''}`} aria-pressed={hub.orderFilter === filter.id} onClick={() => { hub.setOrderFilter(filter.id); hub.setOrderPage(1); }}>{filter.label} <span>{hub.orderCounts?.[filter.id] ?? 0}</span></button>)}</div>
    <div className="nx-seller-inventory"><div className="nx-seller-table-wrap"><table className="nx-seller-table nx-seller-orders-table"><thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Số sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th><th /></tr></thead><tbody>
      {hub.visibleOrders.map(order => <tr key={order.id}><td><strong>{order.code}</strong></td><td>{order.placedAt}</td><td>{order.itemCount}</td><td><strong className="nx-seller-price">{formatSellerMoney(order.total)}</strong></td><td><span className={`nx-seller-status nx-seller-status--${order.status}`}>{orderStatusLabels[order.status]}</span></td><td><Link className="nx-seller-text-button" to={`/seller/orders/success?orderId=${encodeURIComponent(order.id)}`}>Xem đơn →</Link></td></tr>)}
      {!hub.loading && !hub.error && !hub.visibleOrders.length && <tr><td colSpan={6} className="nx-seller-empty">Không có đơn hàng ở trạng thái này.</td></tr>}
    </tbody></table></div><div className="nx-seller-pagination"><span>Trang {hub.orderPage ?? 1} / {hub.orderPages ?? 1}</span><nav aria-label="Phân trang đơn hàng"><button type="button" disabled={(hub.orderPage ?? 1) <= 1} onClick={() => hub.setOrderPage(hub.orderPage - 1)}>Trước</button><button type="button" disabled={(hub.orderPage ?? 1) >= (hub.orderPages ?? 1)} onClick={() => hub.setOrderPage(hub.orderPage + 1)}>Tiếp</button></nav></div></div>
  </section>;
}
