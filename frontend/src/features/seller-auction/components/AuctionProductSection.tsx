import { Link } from 'react-router-dom';
import type { CreateAuctionState } from '../hooks/useCreateAuction';
import AuctionSection from './AuctionSection';

export default function AuctionProductSection({ hub }: { hub: CreateAuctionState }) {
  const { draft, products, product } = hub;
  const images = product ? [...new Set([product.image, ...product.images].filter(Boolean))] : [];
  return <AuctionSection number={1} title="Nguồn Sản Phẩm & Tài Liệu Minh Bạch" caption="Chọn sản phẩm từ kho của bạn để bắt đầu thiết lập phiên đấu giá." aside={<div className="sca-catalog-tabs"><span>Kho sẵn có</span><button type="button" disabled title="Tạo sản phẩm mới trong quản lý kho">Tạo mới</button></div>}>
    {hub.loading && <p className="sca-inline-status" role="status">Đang tải kho sản phẩm…</p>}
    {hub.loadError && <div className="sca-inline-status is-error" role="alert"><p>{hub.loadError}</p><button type="button" onClick={hub.retry}>Thử lại</button></div>}
    {!hub.loading && !hub.loadError && !products.length && <p className="sca-inline-status">Kho chưa có sản phẩm phù hợp. <Link to="/seller-hub">Quản lý kho sản phẩm</Link></p>}
    <label className="sca-field"><span>Chọn sản phẩm từ kho của bạn <em>*</em></span>
      <select id="sca-product" value={draft.productId} disabled={hub.loading || !!hub.loadError || !products.length || hub.busy || !!hub.created} onChange={event => hub.selectProduct(event.target.value)}>
        <option value="">Tìm và chọn sản phẩm trong kho</option>{products.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    {product ? <><div className="sca-selected-product">
      {product.image ? <img src={product.image} alt={product.name} /> : <div className="sca-product-placeholder"><i className="bi bi-image" aria-hidden="true" /></div>}<div className="sca-product-details"><span className="sca-category">SẢN PHẨM ĐÃ CHỌN</span><h3>{product.name}</h3><p>SKU: {product.sku || 'Chưa có'} <span>•</span> {product.category}</p>{product.description && <p className="sca-product-description">{product.description}</p>}</div><i className="bi bi-check-circle-fill" aria-label="Đã chọn" />
    </div><div className="sca-label-line"><strong>Bộ sưu tập ảnh sản phẩm thực tế</strong><span>{images.length} ảnh từ kho sản phẩm</span></div>{images.length > 0 ? <div className="sca-photos">{images.map((image, i) => <div className="sca-photo" key={image}><img src={image} alt={`${product.name} — ảnh ${i + 1}`} />{i === 0 && <span>Ảnh đại diện</span>}</div>)}</div> : <div className="sca-media-empty">Sản phẩm chưa có hình ảnh.</div>}</> : <div className="sca-media-empty"><i className="bi bi-images" aria-hidden="true" /><strong>Thông tin và hình ảnh sản phẩm</strong><p>Chọn một sản phẩm trong kho để xem thông tin tại đây.</p></div>}
    <p className="sca-note"><i className="bi bi-info-circle" aria-hidden="true" />Hình ảnh và mô tả lấy từ sản phẩm đã lưu. Chỉnh sửa trong quản lý sản phẩm, không tải ảnh tại bước tạo phiên.</p>
  </AuctionSection>;
}

