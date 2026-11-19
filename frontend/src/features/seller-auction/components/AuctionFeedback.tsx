import { Link } from 'react-router-dom';
import type { CreateAuctionState } from '../hooks/useCreateAuction';
export default function AuctionFeedback({hub}:{hub:CreateAuctionState}) {
  return <>{hub.errors.length>0&&<div className="sca-feedback is-error" role="alert"><strong>Chưa thể tạo phiên</strong><ul>{hub.errors.map(error=><li key={error}>{error}</li>)}</ul>{hub.uncertain&&<Link to="/seller-hub?tab=auctions">Kiểm tra danh sách phiên</Link>}</div>}{hub.created&&<div className="sca-feedback" role="status"><p>Đã tạo phiên đấu giá.</p><Link to={`/seller/auctions/${encodeURIComponent(hub.created.id)}/result`}>Xem chi tiết phiên →</Link></div>}</>;
}
