import { Link } from 'react-router-dom';
import { useSellerAuctionResult } from '../hooks/useSellerAuctionResult';
import '../styles/auction-result.css';
const statuses:Record<string,string>={ACTIVE:'Đang diễn ra',SCHEDULED:'Đã lên lịch',ENDED:'Đã kết thúc',SETTLED:'Đã chốt',CANCELLED:'Đã hủy',WON:'Đã có người thắng',NO_BIDS:'Không có lượt trả giá hợp lệ',FAILED:'Giao dịch không thành công'};
export default function SellerAuctionResultPage() {
  const hub=useSellerAuctionResult();
  if(hub.loading)return <main className="nx-auction-result"><div className="nx-container" role="status">Đang tải phiên đấu giá…</div></main>;
  if(hub.error||!hub.result)return <main className="nx-auction-result"><div className="nx-container"><p role="alert">{hub.error||'Không tìm thấy phiên đấu giá.'}</p><button type="button" className="nx-seller-primary" onClick={hub.retry}>Thử lại</button><Link className="nx-seller-back" to="/seller-hub?tab=auctions">Về danh sách phiên</Link></div></main>;
  const result=hub.result;
  const hasWinner=result.winner.username!=='N/A';
  const settled=['WON','NO_BIDS','FAILED'].includes(result.subtitle);
  return <main className="nx-auction-result"><div className="nx-container nx-seller-result">
    <header className="nx-seller-detail-heading"><Link className="nx-seller-back" to="/seller-hub?tab=auctions">← Phiên đấu giá</Link><h1>{settled?result.title:'Chi tiết phiên đấu giá'}</h1><p><span className="nx-stock-status">{statuses[result.subtitle]??result.subtitle}</span> · {settled?'Chốt lúc':'Kết thúc'} {result.endedAt}</p></header>
    <section className="nx-seller-card nx-seller-result-summary"><div className="nx-seller-result-product">{result.product.image&&<img src={result.product.image} alt="" />}<div><h2>{result.product.name}</h2><p>{result.product.category}</p></div></div><dl className="nx-seller-result-metrics"><div><dt>Giá khởi điểm</dt><dd>{result.startingPrice}</dd></div>{result.subtitle==='WON'&&<div><dt>Giá chốt</dt><dd>{result.winningBid}</dd></div>}<div><dt>Lượt trả giá hợp lệ</dt><dd>{result.bidCount}</dd></div></dl>{hasWinner&&<p className="nx-seller-winner-id">Người thắng: <strong>{result.winner.name}</strong></p>}{result.orderId&&<Link className="nx-seller-primary" to={`/seller/orders/success?orderId=${encodeURIComponent(result.orderId)}`}>Xem đơn hàng</Link>}</section>
    <section className="nx-seller-card nx-seller-bids"><h2>Lịch sử trả giá</h2><p className="nx-seller-muted">Các lượt trả giá hợp lệ, mới nhất trước.</p>{result.bids.length?<div className="nx-seller-table-wrap"><table className="nx-seller-table"><thead><tr><th>Người trả giá</th><th>Số tiền</th><th>Thời gian</th></tr></thead><tbody>{result.bids.map(bid=><tr key={bid.id}><td><span className="nx-seller-bidder-id">{bid.name}</span>{bid.winner&&<span className="nx-seller-winner-badge">Người thắng</span>}</td><td><strong>{bid.amount}</strong></td><td>{bid.time}</td></tr>)}</tbody></table></div>:<p>Chưa có lượt trả giá hợp lệ.</p>}{hub.bidError&&<p role="alert" className="nx-seller-alert">{hub.bidError}</p>}{result.bidPage+1<result.bidTotalPages&&<button type="button" className="nx-seller-secondary" disabled={hub.bidLoading} onClick={()=>void hub.loadMoreBids()}>{hub.bidLoading?'Đang tải…':'Tải thêm'}</button>}</section>
  </div></main>;
}
