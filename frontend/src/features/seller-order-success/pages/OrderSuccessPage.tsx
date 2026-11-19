import { Link } from 'react-router-dom';
import { useOrderSuccess } from '../hooks/useOrderSuccess';
import OrderSuccessHero from '../components/OrderSuccessHero';
import OrderSuccessDetails from '../components/OrderSuccessDetails';
import '../styles/order-success.css';
export default function OrderSuccessPage() {
  const state=useOrderSuccess();
  return <main className="nx-success-page"><div className="nx-container"><Link className="nx-seller-back" to="/seller-hub?tab=orders">← Đơn hàng</Link>{state.loading?<p role="status">Đang tải đơn hàng…</p>:state.error||!state.order?<section className="nx-seller-alert" role="alert"><p>{state.error||'Không tìm thấy đơn hàng.'}</p><Link to="/seller-hub?tab=orders">Về danh sách đơn hàng</Link></section>:<><OrderSuccessHero {...state} order={state.order} /><OrderSuccessDetails {...state} order={state.order} /></>}</div></main>;
}
