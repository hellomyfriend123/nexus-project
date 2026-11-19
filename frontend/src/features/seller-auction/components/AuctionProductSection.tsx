import { Link } from 'react-router-dom';
import type { CreateAuctionState } from '../hooks/useCreateAuction';
import AuctionSection from './AuctionSection';
export default function AuctionProductSection({hub}:{hub:CreateAuctionState}) {
  return <AuctionSection number={1} title="Sản phẩm" caption="Chọn một sản phẩm của bạn.">
    {hub.loading&&<p role="status">Đang tải sản phẩm…</p>}
    {hub.loadError&&<div role="alert" className="nx-seller-alert"><p>{hub.loadError}</p><button type="button" onClick={hub.retry}>Thử lại</button></div>}
    {!hub.loading&&!hub.loadError&&!hub.products.length&&<p>Chưa có sản phẩm phù hợp. <Link to="/seller/products/new">Thêm sản phẩm</Link></p>}
    <label className="sca-field"><span>Sản phẩm <em>*</em></span><select id="sca-product" value={hub.draft.productId} disabled={hub.loading||!!hub.loadError||!hub.products.length} onChange={event=>hub.selectProduct(event.target.value)}><option value="">Chọn sản phẩm</option>{hub.products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
    {hub.product&&<div className="sca-selected-product">{hub.product.image&&<img src={hub.product.image} alt="" />}<div><h3>{hub.product.name}</h3><p>{hub.product.category}</p></div><Link to={`/products/${encodeURIComponent(hub.product.id)}`}>Xem sản phẩm</Link></div>}
  </AuctionSection>;
}
