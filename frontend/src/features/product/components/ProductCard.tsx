import { Link } from 'react-router-dom';
import type { Listing } from '../../../services/api/catalog';
import { formatPrice } from '../services/productService';
import { CatalogImage } from './CatalogProductCard';
import AddToCartButton from './AddToCartButton';
import useProductCardMotion from '../hooks/useProductCardMotion';
import '../styles/product-card-motion.css';
function ProductCard({ product }: { product: Listing }) {
 const { cardRef, onPointerMove, onPointerLeave } = useProductCardMotion();
 const auction = product.auction;
 const url = '/products/' + product.id + (auction ? '?auctionId=' + auction.id : '');
 return <article ref={cardRef} className="nx-product-card u049-product-card" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
 <div className="nx-card-media"><span className={'nx-tag ' + (auction ? 'nx-tag-red' : '')}>{auction ? '◷ Đấu giá trực tiếp' : 'MUA NGAY'}</span>
 <Link to={url}><CatalogImage className="u049-product-image" url={product.primaryImageUrl} name={product.name} /></Link></div>
 <div className="nx-card-body"><div className="nx-card-meta">{product.categoryName}</div>
 <Link className="nx-card-title" to={url}>{product.name}</Link>
 <div className={'nx-price ' + (auction ? 'nx-red' : 'nx-blue')}>{auction && <small>Giá đấu hiện tại: </small>}{formatPrice(auction?.currentPrice ?? product.basePrice)}</div>
 {auction && <small className="nx-shipping">Kết thúc: {new Date(auction.endTime).toLocaleString('vi-VN')}</small>}
 <div className="nx-card-actions">{auction ? <Link className="nx-button nx-button-primary" to={url}>Xem phiên đấu giá</Link> : <AddToCartButton product={product} />}</div></div></article>;
} export default ProductCard;
