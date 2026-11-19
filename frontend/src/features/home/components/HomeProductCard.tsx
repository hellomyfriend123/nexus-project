import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '../../../services/api/catalog';
import { formatPrice } from '../../product/services/productService';
import AddToCartButton from '../../product/components/AddToCartButton';
import useProductCardMotion from '../../product/hooks/useProductCardMotion';
import '../../product/styles/product-card-motion.css';

export default function HomeProductCard({ product }: { product: Listing }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const { cardRef, onPointerMove, onPointerLeave } = useProductCardMotion();
  const auction = product.auction;
  const to = `/products/${product.id}${auction ? `?auctionId=${encodeURIComponent(auction.id)}` : ''}`;
  return <article ref={cardRef} className="nx-home-card u049-product-card" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
    <Link to={to} className="nx-home-card__media" aria-label={`Xem ${product.name}`}>
      {product.primaryImageUrl && failedImage !== product.primaryImageUrl
        ? <img className="u049-product-image" src={product.primaryImageUrl} alt={product.name} loading="lazy" decoding="async" width={300} height={300} onError={() => setFailedImage(product.primaryImageUrl)} />
        : <span className="nx-home-card__placeholder"><i className="bi bi-image" aria-hidden="true" /><span>Chưa có ảnh</span></span>}
      {auction && <span className="nx-home-card__badge"><i className="bi bi-hammer" aria-hidden="true" /> Đấu giá</span>}
    </Link>
    <div className="nx-home-card__body">
      <span className="nx-home-card__category">{product.categoryName || '\u00a0'}</span>
      <div className="nx-home-card__summary">
        <Link to={to} className="nx-home-card__title" title={product.name}>{product.name}</Link>
        <strong className="nx-home-card__price" aria-label={`${auction ? 'Giá đấu hiện tại' : 'Giá'}: ${formatPrice(auction?.currentPrice ?? product.basePrice)}`}>{formatPrice(auction?.currentPrice ?? product.basePrice)}</strong>
      </div>
      {auction && <time className="nx-home-card__end" dateTime={auction.endTime}>Kết thúc {new Date(auction.endTime).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time>}
      <div className="nx-home-card__action">{auction ? <Link className="nx-button nx-button-light" to={to}>Xem phiên đấu giá →</Link> : <AddToCartButton product={product} className="nx-button nx-button-light" />}</div>
    </div>
  </article>;
}
