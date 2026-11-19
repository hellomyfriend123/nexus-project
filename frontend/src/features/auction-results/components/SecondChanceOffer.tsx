export default function SecondChanceOffer(_props: { amount: number; subscribed: boolean; onSubscribe: (value: boolean) => void; onAction: (label: string) => void }) {
 return <section className="ar-panel ar-second-chance"><div className="ar-section-heading"><h2>Cơ hội thứ hai</h2><span className="ar-tag">Cơ hội thứ hai chưa được hỗ trợ.</span></div><p>Cơ hội thứ hai chưa được hỗ trợ.</p><button className="ar-button ar-primary" disabled>Giữ vị trí dự phòng chưa được hỗ trợ.</button></section>;
}
