import type { CreateAuctionState } from '../hooks/useCreateAuction';
import AuctionSection from './AuctionSection';
export default function AuctionPricingSection({hub}:{hub:CreateAuctionState}) {
  return <AuctionSection number={2} title="Giá khởi điểm" caption="Mức giá bắt đầu cho phiên đấu giá."><label className="sca-field"><span>Giá khởi điểm (đ) <em>*</em></span><div className="sca-money"><input type="number" min="0.01" step="0.01" required value={hub.draft.startingPrice} onChange={event=>hub.update('startingPrice',event.target.value)} aria-label="Giá khởi điểm" /><b>đ</b></div></label></AuctionSection>;
}
