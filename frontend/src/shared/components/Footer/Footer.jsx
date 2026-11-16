import './Footer.css';

export default function Footer() {
  const buyLinks = [
    { label: 'Đăng ký tài khoản', href: '#register' },
    { label: 'Săn khuyến mãi', href: '#promotions' },
    { label: 'Cách tham gia đấu giá', href: '#how-to-bid' },
    { label: 'Hướng dẫn thanh toán', href: '#payment-guide' },
  ];

  const sellLinks = [
    { label: 'Bắt đầu đăng bán', href: '#start-selling' },
    { label: 'Kênh người bán (Seller Hub)', href: '#seller-hub' },
    { label: 'Chính sách & biểu phí', href: '#seller-policies' },
    { label: 'Cẩm nang nhà bán hàng', href: '#seller-guide' },
  ];

  const aboutLinks = [
    { label: 'Giới thiệu công ty', href: '#about-us' },
    { label: 'Tin tức & Sự kiện', href: '#news' },
    { label: 'Cơ hội nghề nghiệp', href: '#careers' },
    { label: 'Chương trình đối tác', href: '#partners' },
  ];

  const policyLinks = [
    { label: 'Trung tâm trợ giúp 24/7', href: '#help-center' },
    { label: 'Quy chế hoạt động sàn', href: '#terms-of-operation' },
    { label: 'Chính sách bảo mật', href: '#privacy-policy' },
    { label: 'Giải quyết khiếu nại', href: '#dispute-resolution' },
  ];

  const paymentMethods = ['VISA', 'Mastercard', 'MoMo', 'VNPay'];

  return (
    <footer className="nexus-footer">
      <div className="nexus-footer-container">
        {/* 1. NEXUS GUARANTEE TRUST BANNER */}
        <section className="nexus-guarantee-banner" aria-label="Cam kết Nexus Guarantee">
          <div className="guarantee-left">
            <div className="guarantee-shield-icon">
              <i className="bi bi-shield-check"></i>
            </div>
            <div>
              <div className="guarantee-title">Bảo vệ người mua Nexus Guarantee</div>
              <p className="guarantee-desc">
                Hoàn tiền 100% nếu hàng không đúng mô tả hoặc thất lạc vận chuyển
              </p>
            </div>
          </div>

          <div className="guarantee-right">
            <div className="guarantee-feature-item">
              <i className="bi bi-truck"></i>
              <span>Giao hàng bảo đảm toàn quốc</span>
            </div>
            <div className="guarantee-feature-item">
              <i className="bi bi-hammer"></i>
              <span>Đấu giá minh bạch & tức thì</span>
            </div>
          </div>
        </section>

        {/* 2. MAIN FOOTER LINKS (5 COLUMNS) */}
        <div className="nexus-footer-columns">
          {/* Column 1 */}
          <div className="footer-col">
            <h5 className="footer-col-title">Mua hàng trên Nexus</h5>
            <ul className="footer-links-list">
              {buyLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="footer-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div className="footer-col">
            <h5 className="footer-col-title">Bán hàng cùng Nexus</h5>
            <ul className="footer-links-list">
              {sellLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="footer-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div className="footer-col">
            <h5 className="footer-col-title">Về Project Nexus</h5>
            <ul className="footer-links-list">
              {aboutLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="footer-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 */}
          <div className="footer-col">
            <h5 className="footer-col-title">Chính sách & Trợ giúp</h5>
            <ul className="footer-links-list">
              {policyLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="footer-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 */}
          <div className="footer-col">
            <h5 className="footer-col-title">Phương thức thanh toán</h5>
            <div className="payment-badges-wrap">
              {paymentMethods.map((method) => (
                <span key={method} className="pay-badge">
                  {method}
                </span>
              ))}
            </div>

            <h5 className="footer-col-title mb-2">Kết nối với chúng tôi</h5>
            <div className="contact-support-text">
              Hỗ trợ:{' '}
              <a href="mailto:support@nexusmarket.vn">support@nexusmarket.vn</a>
            </div>
          </div>
        </div>

        {/* 3. COPYRIGHT & LEGAL BOTTOM BAR */}
        <div className="nexus-footer-bottom">
          <div className="copyright-text">
            © 2025 Project Nexus Inc. Bảo lưu mọi quyền.
          </div>

          <div className="legal-links">
            <a href="#terms" className="legal-link">
              Điều khoản dịch vụ
            </a>
            <a href="#privacy" className="legal-link">
              Quyền riêng tư
            </a>
            <a href="#cookies" className="legal-link">
              Tùy chọn cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
