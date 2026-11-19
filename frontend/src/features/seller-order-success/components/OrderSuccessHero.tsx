import { nextOrderStatus } from '../../../services/api/seller';
import type { LoadedOrderSuccessState } from '../types/orderSuccess';
const labels:Record<string,string>={PENDING:'Chờ xác nhận',CONFIRMED:'Đã xác nhận',SHIPPING:'Đang giao',COMPLETED:'Hoàn tất',CANCELLED:'Đã hủy'};
const actions:Record<string,string>={PENDING:'Xác nhận đơn',CONFIRMED:'Chuyển sang đang giao',SHIPPING:'Hoàn tất đơn'};
export default function OrderSuccessHero({order,busy,transition}:LoadedOrderSuccessState) {
  return <header className="nx-success-hero"><div><p className="nx-success-order-code">Đơn hàng {order.orderNumber}</p><h1>{labels[order.status]??order.status}</h1><p className="nx-seller-muted">Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')}</p></div><div className="nx-success-hero-actions">{nextOrderStatus[order.status]&&<button disabled={busy} type="button" className="nx-seller-primary" onClick={()=>void transition()}>{actions[order.status]}</button>}{nextOrderStatus[order.status]&&<button disabled={busy} type="button" className="nx-seller-secondary nx-seller-danger" onClick={()=>{if(window.confirm('Hủy đơn hàng này?'))void transition(true);}}>Hủy đơn</button>}</div></header>;
}
