import type { AuctionSummary, Settlement } from '../types/auctionResult';
export default function SettlementStatus(_props: { summary: AuctionSummary; settlement: Settlement; onAction: (label: string) => void }) {
 return <section className="ar-panel ar-refund"><div className="ar-section-heading"><h2><i className="bi bi-wallet2 ar-blue" /> Hoàn cọc bảo chứng</h2><span className="ar-tag">Chưa có dữ liệu</span></div><div className="ar-refund-amount"><p>API kết quả không cung cấp số tiền cọc, giao dịch hoàn tiền hoặc số dư ví. Chưa thể xác nhận hoàn cọc.</p></div><button className="ar-button ar-primary" disabled>Ví Nexus chưa được hỗ trợ.</button></section>;
}
