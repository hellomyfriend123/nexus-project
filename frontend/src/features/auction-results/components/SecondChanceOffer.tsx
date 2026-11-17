export default function SecondChanceOffer(_props: { amount: number; subscribed: boolean; onSubscribe: (value: boolean) => void; onAction: (label: string) => void }) {
 return <section className="ar-panel ar-second-chance"><div className="ar-section-heading"><h2>Cơ hội thứ hai</h2><span className="ar-tag">Chưa khả dụng</span></div><p>Backend chưa cung cấp vị trí dự phòng, lời mời mua, thời hạn hoặc đăng ký thông báo cơ hội thứ hai.</p><button className="ar-button ar-primary" disabled>Chưa hỗ trợ giữ vị trí dự phòng</button></section>;
}
