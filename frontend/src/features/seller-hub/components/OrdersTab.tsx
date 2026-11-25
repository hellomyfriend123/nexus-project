import { Link } from 'react-router-dom';
import type { SellerHubState } from '../hooks/useSellerHub';
import type { SellerOrder } from '../types/sellerHub';
import { formatSellerMoney, orderStatusLabels, sellerOrderFilters } from '../constants/sellerHub.constants';

function OrderRow({ order }: { order: SellerOrder }) {
  return <tr className={order.express && order.status === 'pending' ? 'nx-seller-auction-row' : ''}>
    <td><div className="nx-seller-order-cell"><strong>{order.code}</strong><small>{order.placedAt}</small></div></td>
    <td><div className="nx-seller-order-cell"><strong>{order.buyer}</strong><small>{order.contact}</small></div></td>
    <td><div className="nx-seller-order-items"><strong title={order.items}>{order.items}</strong><small>{order.itemCount}</small></div></td>
    <td><strong className="nx-seller-price">{formatSellerMoney(order.total)}</strong></td>
    <td><span className={`nx-seller-method ${order.express ? 'nx-seller-method--auction' : ''}`}><i className={`bi bi-${order.express ? 'lightning-charge' : 'truck'}`} aria-hidden="true" />{order.method}</span></td>
    <td><div className="nx-seller-order-cell"><span className={`nx-seller-status nx-seller-status--${order.status}`}>{orderStatusLabels[order.status]}</span><small className={order.status === 'pending' ? 'nx-seller-red-text' : ''}>{order.deadline}</small></div></td>
    <td><Link className="nx-seller-button" to={`/seller/orders/success?orderId=${encodeURIComponent(order.id)}`}>Xem đơn </Link></td>
  </tr>;
}

export default function OrdersTab({ hub }: { hub: SellerHubState }) {
  const expressCount = hub.visibleOrders.filter(order => order.express).length;
  return <section role="tabpanel" id="hub-panel-orders" aria-labelledby="hub-tab-orders" className="nx-seller-panel">
    <div className="nx-seller-panel-heading"><div><h2>Đơn Hàng  (Fulfillment)</h2><p>{hub.pendingOrders} đơn chờ duyệt, trong đó {expressCount} đơn giao gấp. Dữ liệu đơn hàng được tải từ hệ thống.</p></div>
      <button className="nx-seller-button" onClick={() => hub.mockAction('In toàn bộ nhãn vận chuyển')}><i className="bi bi-printer" aria-hidden="true" /> In nhãn hàng loạt</button></div>
    <div className="nx-seller-chips" role="group" aria-label="Lọc đơn hàng">{sellerOrderFilters.map(filter =>
      <button key={filter.id} type="button" className={`nx-seller-chip ${hub.orderFilter === filter.id ? 'is-active' : ''}`} aria-pressed={hub.orderFilter === filter.id} onClick={() => hub.setOrderFilter(filter.id)}>{filter.label} <span>{hub.orderCounts?.[filter.id] ?? 0}</span></button>)}
      <span className="nx-seller-chips-note"><i className="bi bi-lightning-charge nx-seller-red-text" aria-hidden="true" />  • Chi tiết giao nhận trong đơn</span></div>
    <div className="nx-seller-inventory nx-seller-inventory--plain">
      <div className="nx-seller-table-wrap"><table className="nx-seller-table nx-seller-table--orders"><thead><tr><th>Mã đơn</th><th>Người mua</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Vận chuyển</th><th>Trạng thái / Hạn xử lý</th><th>Thao tác</th></tr></thead>
        <tbody>{hub.visibleOrders.map(order => <OrderRow key={order.id} order={order} />)}{!hub.visibleOrders.length && <tr><td colSpan={7} className="nx-seller-empty">Không có đơn hàng ở trạng thái này.</td></tr>}</tbody></table></div>
      <div className="nx-seller-pagination"><span>Hiển thị {hub.visibleOrders.length} đơn  trong bộ lọc hiện tại</span><nav aria-label="Phân trang đơn hàng"><button disabled={(hub.orderPage??1)===1} onClick={()=>hub.setOrderPage(hub.orderPage-1)}>Trước</button><button className="is-active" aria-current="page">{hub.orderPage??1}</button><button disabled={(hub.orderPages??1)<2} onClick={()=>hub.setOrderPage(2)}>2</button><button disabled={(hub.orderPage??1)>=(hub.orderPages??1)} onClick={()=>hub.setOrderPage(hub.orderPage+1)}>Tiếp theo</button></nav></div>
    </div>
  </section>;
}
