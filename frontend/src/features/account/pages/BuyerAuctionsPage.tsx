import UnsupportedSection from '../components/UnsupportedSection';

/**
 * "Auctions I joined" section for buyers.
 *
 * Blocked on the backend: BidRepository has no query by bidderId, and the auction module never
 * calls nexus-notification (BidServiceImpl and the settlement scheduler both leave it as a TODO),
 * so OUTBID/AUCTION_WON are never emitted. There is no way to resolve a bidder's auctions without
 * scanning every auction.
 */
export default function BuyerAuctionsPage() {
  return (
    <UnsupportedSection
      title="Đấu giá đã tham gia"
      description="Theo dõi các phiên đấu giá bạn đã đặt giá."
      gap="Backend hiện chưa có API liệt kê phiên đấu giá theo người đặt giá, nên chưa thể hiển thị danh sách này."
      missingEndpoint="GET /api/v1/buyer/auction/auctions?bidder=me"
    />
  );
}
