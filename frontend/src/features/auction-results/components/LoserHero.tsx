import { Link } from 'react-router-dom';
import type { AuctionSummary } from '../types/auctionResult';
import { formatMoney } from '../services/auctionResultService';
export default function LoserHero({ summary }: { summary: AuctionSummary }) {
  return <section className="ar-result-hero"><p className="ar-eyebrow">PHIÊN ĐÃ KẾT THÚC</p><h1>Bạn chưa thắng phiên đấu giá này</h1><p>Phiên kết thúc lúc {summary.endedAt}.</p>
    <dl className="ar-result-stats"><div><dt>Giá thắng thầu</dt><dd>{formatMoney(summary.winningBid)}</dd></div>{summary.personalBid != null && <div><dt>Giá cao nhất của bạn</dt><dd>{formatMoney(summary.personalBid)}</dd></div>}<div><dt>Lượt giá hợp lệ</dt><dd>{summary.bidCount}</dd></div></dl>
    <Link className="nx-button nx-button-primary" to="/products?mode=auction">Khám phá phiên đấu giá khác</Link>
  </section>;
}

