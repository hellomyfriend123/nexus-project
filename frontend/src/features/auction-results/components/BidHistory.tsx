import type { Bid } from '../types/auctionResult';
import { formatMoney } from '../services/auctionResultService';
export default function BidHistory({ bids }: { bids: Bid[] }) {
  return <section className="ar-panel ar-history"><div className="ar-section-heading"><div><h2>Lịch sử đặt giá</h2><p>Các lượt giá được chấp nhận, mới nhất trước.</p></div></div>
    <div className="ar-table-wrap"><table><thead><tr><th scope="col">Người đặt giá</th><th scope="col">Mức giá</th><th scope="col">Thời gian</th><th scope="col">Kết quả</th></tr></thead><tbody>{bids.map(bid => <tr key={bid.id} className={bid.winner ? 'ar-winning-row' : ''}><td>{bid.own ? 'Bạn' : 'Người mua · ' + bid.bidder.slice(0, 8)}</td><td><b>{formatMoney(bid.amount)}</b></td><td>{bid.time}</td><td>{bid.winner ? 'Giá thắng thầu' : 'Đã chấp nhận'}</td></tr>)}</tbody></table></div>
  </section>;
}

