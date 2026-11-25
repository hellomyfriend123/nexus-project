import { Link } from 'react-router-dom';
import { useOrderSuccess } from '../hooks/useOrderSuccess';
import OrderSuccessHero from '../components/OrderSuccessHero';
import OrderSuccessDetails from '../components/OrderSuccessDetails';
import '../styles/order-success.css';
export default function OrderSuccessPage(){
 const state=useOrderSuccess();
 const {order,loading,error}=state;
 return <main className="nx-success-page"><div className="nx-container">
 <nav className="nx-success-topbar" aria-label="Điều hướng đơn hàng"><Link to="/seller-hub">← Seller Hub</Link><span className="nx-success-status">Đơn hàng người bán</span></nav>
 {!order?<section className="nx-success-hero"><div className="nx-success-hero-inner"><div className="nx-success-hero-text"><h1>{loading?'Đang tải đơn hàng…':'Không thể hiển thị đơn hàng'}</h1><p role={error?'alert':'status'}>{error}</p><Link className="nx-success-btn is-primary" to="/seller-hub">Về Seller Hub</Link></div></div></section>:<>
 <OrderSuccessHero {...state} order={order}/>
 <OrderSuccessDetails {...state} order={order}/>
 </>}
 </div></main>;
}
