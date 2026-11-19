import { Link } from 'react-router-dom';

const benefits = [
  {
    icon: '♧',
    title: 'Giao dịch an toàn',
    text: 'Thanh toán được bảo vệ. An tâm trong từng giao dịch.',
  },
  {
    icon: '✓',
    title: 'Chất lượng đảm bảo',
    text: 'Sản phẩm được kiểm duyệt từ những người bán uy tín.',
  },
  {
    icon: '♬',
    title: 'Hỗ trợ tận tâm',
    text: 'Đội ngũ Nexus luôn sẵn sàng đồng hành cùng bạn.',
  },
  {
    icon: '↗',
    title: 'Giao hàng toàn quốc',
    text: 'Nhanh chóng, thuận tiện, theo dõi mọi lúc mọi nơi.',
  },
];

function PromotionSection() {
  return (
    <>
      <section className="nx-home-promo" aria-labelledby="home-community-title">
        <div>
          <span className="nx-section-kicker">KẾT NỐI ĐAM MÊ CÔNG NGHỆ</span>
          <h2 id="home-community-title">
            Nơi những món đồ tốt tìm được chủ nhân mới.
          </h2>
          <p>Tham gia cộng đồng mua bán công nghệ đáng tin cậy cùng Nexus.</p>
        </div>
        <Link to="/categories/all" className="nx-button nx-button-primary">
          Khám phá ngay <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="nx-stats" aria-label="Nexus qua những con số">
        <div className="nx-stat">
          <strong>N/A</strong>
          <span>Chưa có thống kê giao dịch</span>
        </div>
        <div className="nx-stat">
          <strong>N/A</strong>
          <span>Chưa có thống kê độ tin cậy</span>
        </div>
        <div className="nx-stat">
          <strong>N/A</strong>
          <span>Chưa có thống kê tốc độ</span>
        </div>
        <div className="nx-stat">
          <strong>N/A</strong>
          <span>Chưa có dữ liệu bảo hiểm</span>
        </div>
      </section>

      <h2 className="nx-trust-title">Giao dịch an toàn & Cam kết Nexus</h2>
      <p className="nx-trust-subtitle">
        Hệ thống bảo vệ đa tầng giúp bạn mua và bán an tâm tại mọi thời điểm.
      </p>
      <section className="nx-trust-grid" aria-label="Cam kết từ Nexus">
        {benefits.map((benefit) => (
          <div className="nx-trust-card" key={benefit.title}>
            <span className="nx-trust-icon" aria-hidden="true">
              {benefit.icon}
            </span>
            <div>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

export default PromotionSection;
