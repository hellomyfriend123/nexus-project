import type { CreateAuctionState } from '../hooks/useCreateAuction';
import { formatAuctionMoney } from '../utils/auctionFormatting';

export default function AuctionPreview({ hub }: { hub: CreateAuctionState }) {
  const { product, draft } = hub;
  return <section className="sca-preview"><div className="sca-preview-heading"><i className="bi bi-eye" aria-hidden="true" /> Xem trước phiên đấu giá<span>BẢN XEM TRƯỚC</span></div>
    <div className={`sca-preview-image ${!product?.image ? 'is-empty' : ''}`}>{product?.image ? <img src={product.image} alt={product.name} /> : <div><i className="bi bi-image" aria-hidden="true" /><p>{product ? 'Sản phẩm chưa có hình ảnh' : 'Chưa chọn sản phẩm'}</p></div>}</div>
    <div className="sca-preview-content"><span className="sca-category">{product?.category || 'SẢN PHẨM ĐẤU GIÁ'}</span><h3>{product?.name || 'Chọn sản phẩm từ kho của bạn'}</h3><div className="sca-preview-price"><p className="sca-muted">Giá khởi điểm</p><strong className="sca-large-price">{draft.startingPrice ? formatAuctionMoney(draft.startingPrice) : '— ₫'}</strong><div className="sca-price-sub"><span>Hình thức</span><b>Đấu giá trực tuyến</b></div></div><div className="sca-countdown"><span>THỜI LƯỢNG DỰ KIẾN</span><strong>{draft.duration} <small>ngày</small></strong></div><p className="sca-preview-disclaimer"><i className="bi bi-info-circle" aria-hidden="true" />Thông tin xem trước, chưa phải phiên đã đăng.</p></div>
  </section>;
}
