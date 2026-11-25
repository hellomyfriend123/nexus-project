import type { CreateAuctionState } from '../hooks/useCreateAuction';
import AuctionSection from './AuctionSection';
import AuctionMoneyInput from './AuctionMoneyInput';

export default function AuctionPricingSection({ hub }: { hub: CreateAuctionState }) {
  return <div id="sca-pricing"><AuctionSection number={2} title="Cấu Hình Tài Chính & Cơ Chế Đặt Giá" caption="Thiết lập giá khởi điểm và các quy tắc giá cho phiên đấu giá.">
    <div className="sca-pricing-inputs">
      <div><AuctionMoneyInput hub={hub} field="startingPrice" label="Giá khởi điểm (Starting Price) *" /><p className="sca-muted">Mức giá bắt đầu cho phiên đấu giá của bạn.</p></div>
      <div className="sca-field"><span>Bước giá tối thiểu</span><div className="sca-disabled-value">Chưa hỗ trợ</div><p className="sca-muted">Không cần nhập bước giá để tạo phiên đấu giá. Trường này không được gửi lên API.</p></div>
    </div>
    <div className="sca-option-block sca-price-options">
      {[['Giá bảo lưu (Reserve Price)', 'Giá tối thiểu người bán mong muốn nhận.'], ['Giá mua ngay (Buy Now)', 'Cho phép mua mà không cần chờ hết phiên.']].map(([title, description]) => <div key={title} className="sca-unavailable-option"><div className="sca-toggle-row"><div><strong>{title}</strong><p>{description}</p></div><button type="button" className="sca-toggle" role="switch" aria-checked={false} aria-label={`${title}: chưa hỗ trợ`} disabled><span /></button></div><div className="sca-disabled-value">Chưa hỗ trợ cấu hình</div></div>)}
    </div>
    <div className="sca-deposit"><i className="bi bi-shield-lock" aria-hidden="true" /><div><strong>Tiền đặt cọc tham gia đấu giá</strong><p>API chưa hỗ trợ cấu hình hoặc xác nhận mức đặt cọc.</p></div><span className="sca-unavailable-label">Chưa khả dụng</span></div>
  </AuctionSection></div>;
}

