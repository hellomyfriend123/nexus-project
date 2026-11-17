import type { CatalogProductDetail } from '../../../services/api/catalog';
import type { useProductDetail } from '../hooks/useProductDetail';
import RichTextContent from '../../../shared/components/RichText/RichTextContent';
import { formatPrice } from '../services/productService';
import QuantityStepper from '../../../shared/components/QuantityStepper/QuantityStepper';
import AddToCartButton from './AddToCartButton';

type Props = { product: CatalogProductDetail; detail: ReturnType<typeof useProductDetail> };

export default function ProductPurchase({ product, detail }: Props) {
 const { auction, unsupported, active, remaining, bid, setBid, quantity, setQuantity, pending, bidRefreshFailed, submitBid, addToCart, notice, bidError, bids, bidPage, setBidPage } = detail;
 return <section className="nx-panel nx-purchase"><span className="nx-eyebrow">Mã sản phẩm: {product.id}</span><h1>{product.name}</h1><RichTextContent className="nx-muted" value={product.description} fallback="Người bán chưa cung cấp mô tả." />
    <div className="nx-seller"><span className="nx-avatar">ID</span><div><b>Người bán</b><small>{product.sellerId}</small><small>Chưa có dữ liệu hồ sơ hoặc xếp hạng người bán.</small></div><button onClick={() => unsupported('Nhắn tin')}>✉ Nhắn tin</button></div>
    <div className="nx-bid-warning">⚠ Thông tin tồn kho, phí vận chuyển và kiểm định chưa có trong dữ liệu catalog. Kiểm tra đơn hàng trước khi xác nhận.</div>
    {auction && <div className="nx-auction-clock"><strong>{active ? '● PHIÊN ĐẤU ĐANG DIỄN RA' : auction.status}</strong><span>{auction.acceptedBidCount ?? '—'} lượt đấu được chấp nhận</span><p>THỜI GIAN CÒN LẠI</p><b>{Math.floor(remaining / 3600000)} <small>giờ</small> : {Math.floor(remaining / 60000) % 60} <small>phút</small> : {Math.floor(remaining / 1000) % 60} <small>giây</small></b></div>}
    <div className="nx-detail-price"><div><small>{auction ? 'Giá khởi điểm:' : 'Giá gốc:'}</small><b>{auction ? formatPrice(auction.startingPrice) : '—'}</b></div><div><small>{auction ? 'Giá cao nhất hiện tại:' : 'Giá mua ngay:'}</small><strong>{formatPrice(auction?.currentPrice ?? product.basePrice)}</strong><small>Chưa bao gồm phí vận chuyển</small></div></div>
    {auction ? <><label className="nx-bid-label" htmlFor="bid-price">Giá thầu của bạn</label><input className="nx-bid-input" id="bid-price" type="number" min={auction.currentPrice} value={bid} onChange={event => setBid(Number(event.target.value))} /><div className="nx-bid-increments">{[10000, 50000, 100000].map(value => <button key={value} onClick={() => setBid(Math.max(bid, auction.currentPrice) + value)}>+{formatPrice(value)}</button>)}</div></> : <div className="nx-bid-label nx-purchase-quantity"><span>Số lượng</span><QuantityStepper value={quantity} label={product.name} onChange={setQuantity} /></div>}
    {auction ? <button className="nx-button nx-button-primary nx-purchase-button" disabled={pending || !active || bidRefreshFailed} onClick={submitBid}>{pending ? 'Đang gửi…' : 'Đặt giá thầu'}</button> : <AddToCartButton product={product} quantity={quantity} onAdded={addToCart} className="nx-button nx-button-primary nx-purchase-button" />}
    {notice && <p className="nx-notice" role="status">{notice}</p>}
    {auction && <details className="nx-history"><summary>Lịch sử đặt giá</summary>{bidError ? <p role="alert">{bidError}</p> : !bids ? <p role="status">Đang tải…</p> : <>{bids.content.length ? bids.content.map(item => <p key={item.id}>{item.bidderId}: <b>{formatPrice(item.amount)}</b> · {new Date(item.placedAt).toLocaleString('vi-VN')}</p>) : <p>Chưa có giá thầu.</p>}<button disabled={bidPage === 0} onClick={() => setBidPage(value => value - 1)}>Trước</button><button disabled={bidPage + 1 >= bids.totalPages} onClick={() => setBidPage(value => value + 1)}>Tiếp</button></>}</details>}
   </section>;
}
