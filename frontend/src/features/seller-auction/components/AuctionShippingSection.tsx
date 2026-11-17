import type { CreateAuctionState } from '../hooks/useCreateAuction';
import AuctionSection from './AuctionSection';

export default function AuctionShippingSection(_props: { hub: CreateAuctionState }) {
  return <AuctionSection number={4} title="Vận Chuyển & Cam Kết Trung Gian Escrow" caption="Thông tin giao nhận và bảo chứng cho sản phẩm đấu giá.">
    <fieldset disabled className="sca-fieldset sca-two-columns"><label className="sca-field"><span>Địa chỉ lấy hàng</span><select defaultValue=""><option value="">Chưa có dữ liệu kho bàn giao</option></select></label><label className="sca-field"><span>Phương thức vận chuyển</span><select defaultValue=""><option value="">Chưa hỗ trợ cấu hình vận chuyển</option></select></label></fieldset>
    <div className="sca-escrow"><i className="bi bi-shield-check" aria-hidden="true" /><div><strong>Bảo chứng giao dịch (Escrow) · Chưa khả dụng</strong><p>API tạo phiên chưa cung cấp cấu hình bảo chứng, thanh toán hoặc đơn vị vận chuyển. Không có lựa chọn hay phí nào trong mục này được gửi khi tạo phiên.</p></div></div>
  </AuctionSection>;
}

