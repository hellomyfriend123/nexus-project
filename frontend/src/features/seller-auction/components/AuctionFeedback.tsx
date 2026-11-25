import { Link } from 'react-router-dom';
import type { CreateAuctionState } from '../hooks/useCreateAuction';
export default function AuctionFeedback({ hub }: { hub: CreateAuctionState }) {
  return <>{hub.errors.length > 0 && <div className="sca-feedback is-error" role="alert"><strong>Không thể tạo phiên:</strong><ul>{hub.errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
    {hub.created && <div className="sca-feedback" role="status"><p>Đã tạo phiên {hub.created.id}. Trạng thái máy chủ: {hub.created.status}.</p><Link to={`/seller/auctions/${encodeURIComponent(hub.created.id)}/result`}>Xem thông tin phiên</Link> • <Link to="/seller-hub">Về Seller Hub</Link></div>}</>;
}
