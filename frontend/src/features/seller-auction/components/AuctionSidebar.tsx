import type { CreateAuctionState } from '../hooks/useCreateAuction';
import AuctionPreview from './AuctionPreview';
import AuctionFees from './AuctionFees';
import AuctionHelp from './AuctionHelp';

export default function AuctionSidebar({ hub }: { hub: CreateAuctionState }) {
  return <aside className={`sca-aside ${hub.preview ? 'is-previewing' : ''}`} id="sca-preview">
    <AuctionPreview hub={hub} /><AuctionFees /><AuctionHelp />
    <div className="sca-actions"><button className="sca-publish" type="submit" disabled={hub.uncertain || hub.busy || hub.loading || !!hub.loadError || !hub.product || !!hub.created}><i className="bi bi-hammer" aria-hidden="true" />{hub.busy ? 'Đang tạo phiên…' : hub.created ? 'Đã tạo phiên' : 'Xác Nhận & Mở Phiên Đấu Giá'}</button>
      <div><button type="button" onClick={hub.togglePreview}><i className="bi bi-eye" aria-hidden="true" />Xem trước</button><button type="button" disabled title="API chưa hỗ trợ lưu bản nháp"><i className="bi bi-floppy" aria-hidden="true" />Lưu bản nháp</button></div>
      <p>Lưu bản nháp chưa được hỗ trợ. Chỉ sản phẩm, giá khởi điểm và thời gian được gửi; trạng thái mở phiên do máy chủ quyết định.</p></div>
  </aside>;
}

