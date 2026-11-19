import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return <footer className="nexus-footer">
    <div className="nexus-footer-container">
      <div className="nexus-footer-brand"><Link to="/" className="nexus-wordmark">nexus<span>.</span></Link><p>Khám phá sản phẩm, mua trực tiếp và tham gia đấu giá cùng Nexus.</p></div>
      <nav aria-label="Khám phá"><h2>Khám phá</h2><Link to="/products?mode=buy-now">Sản phẩm</Link><Link to="/products?mode=auction">Phiên đấu giá</Link><Link to="/cart">Giỏ hàng</Link></nav>
      <nav aria-label="Tài khoản"><h2>Tài khoản</h2><Link to="/buyer-hub">Đơn hàng của tôi</Link><Link to="/seller-hub">Kênh người bán</Link><Link to="/register">Tạo tài khoản</Link></nav>
    </div>
    <div className="nexus-footer-bottom">© {new Date().getFullYear()} Nexus</div>
  </footer>;
}
