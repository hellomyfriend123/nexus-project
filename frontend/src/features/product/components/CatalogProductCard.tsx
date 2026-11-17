import AddToCartButton from './AddToCartButton';
import { Link } from 'react-router-dom';
import type { CatalogProduct } from '../services/catalog.api';
import { formatPrice } from '../services/productService';
export const CATALOG_PURCHASE_NOTICE = 'Có thể thêm giỏ và đặt đơn COD; chưa kiểm tra tồn kho hoặc xử lý thanh toán. Lưu sản phẩm chưa khả dụng.';
export function CatalogImage({ url, name, className = "" }: { url: string | null; name: string; className?: string }) {
  return url ? <img className={"nx-product-image " + className} src={url} alt={name} loading="lazy" style={{ objectFit: 'contain', width: '100%' }} />
    : <div className={"nx-product-image nx-empty " + className} role="img" aria-label={`${name}: chưa có ảnh`}>Chưa có ảnh sản phẩm</div>;
}
export default function CatalogProductCard({ product }: { product: CatalogProduct }) {
  return <article className="nx-product-card u049-product-card">
    <div className="nx-card-media"><span className="nx-tag">MUA NGAY</span>
      <Link to={`/products/${product.id}`}><CatalogImage url={product.primaryImageUrl} name={product.name} /></Link>
    </div>
    <div className="nx-card-body">
      <div className="nx-card-meta">{product.categoryName}</div>
      <Link className="nx-card-title" to={`/products/${product.id}`}>{product.name}</Link>
      <div className="nx-price nx-blue">{formatPrice(product.basePrice)}</div>
      <div className="nx-card-actions"><AddToCartButton product={product} />
        <Link className="nx-button nx-button-soft" to={`/products/${product.id}`}>Xem chi tiết</Link></div>
    </div>
  </article>;
}
