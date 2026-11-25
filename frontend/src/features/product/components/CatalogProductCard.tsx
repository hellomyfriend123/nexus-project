import AddToCartButton from './AddToCartButton';
import { Link } from 'react-router-dom';
import { getSession } from '../../../services/api/auth';
import type { CatalogProduct } from '../services/catalog.api';
import { formatPrice } from '../services/productService';
export const CATALOG_PURCHASE_NOTICE = 'Khám phá sản phẩm và đặt hàng với phương thức thanh toán khi nhận hàng.';
export function CatalogImage({ url, name, className = "" }: { url: string | null; name: string; className?: string }) {
  return url ? <img className={"nx-product-image " + className} src={url} alt={name} loading="lazy" />
    : <div className={"nx-product-image nx-empty " + className} role="img" aria-label={`${name}: chưa có ảnh`}>Chưa có ảnh sản phẩm</div>;
}
export default function CatalogProductCard({ product }: { product: CatalogProduct }) {
  const session = getSession();
  const isReadOnlyRole = Boolean(session?.roles?.includes('SELLER') || session?.roles?.includes('ADMIN'));
  return <article className="nx-product-card u049-product-card">
    <div className="nx-card-media">
      <Link to={`/products/${product.id}`}><CatalogImage url={product.primaryImageUrl} name={product.name} /></Link>
    </div>
    <div className="nx-card-body">
      <div className="nx-card-meta">{product.categoryName}</div>
      <Link className="nx-card-title" to={`/products/${product.id}`}>{product.name}</Link>
      <div className="nx-price nx-blue">{formatPrice(product.basePrice)}</div>
      <div className="nx-card-actions">
        {isReadOnlyRole ? (
          <Link className="nx-button nx-button-outline" to={`/products/${product.id}`}>Xem chi tiết</Link>
        ) : (
          <>
            <AddToCartButton product={product} />
            <AddToCartButton product={product} buyNow />
          </>
        )}
      </div>
    </div>
  </article>;
}
