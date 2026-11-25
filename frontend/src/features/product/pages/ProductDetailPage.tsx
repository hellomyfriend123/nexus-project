import ProductGallery from '../components/ProductGallery';
import ProductPurchase from '../components/ProductPurchase';
import ProductReviews from '../components/ProductReviews';
import RichTextContent from '../../../shared/components/RichText/RichTextContent';
import { useProductDetailResource } from '../hooks/useProductDetailResource';
import { useProductDetail } from '../hooks/useProductDetail';
import { Link } from 'react-router-dom';
import type { CatalogProductDetail, Auction } from '../../../services/api/catalog';
import ProductAssurance from '../components/ProductAssurance';
import HeartBurstButton from '../../../shared/components/Button/HeartBurstButton';
import '../styles/product-detail-animation.css';
function ProductDetailPage() {
 const { product, auction, error, loading, setRetry } = useProductDetailResource();
 if (loading) return <main className="nx-container nx-empty" role="status">Đang tải sản phẩm…</main>;
 if (error || !product) return <main className="nx-container nx-empty" role="alert"><h1>Không thể tải sản phẩm</h1><p>{error}</p><button className="nx-button nx-button-soft" onClick={() => setRetry(value => value + 1)}>Thử lại</button><Link to="/categories/all">Khám phá sản phẩm →</Link></main>;
 return <ProductDetail key={product.id + (auction?.id || '')} product={product} initialAuction={auction} />;
}
export function ProductDetail({ product, initialAuction = null }: { product: CatalogProductDetail; initialAuction?: Auction | null }) {
 const detail = useProductDetail(product, initialAuction);
 const { navigate, auction, added, stageRef, cartRef, badgeRef, unsupported, share } = detail;
 return <main ref={stageRef} className="nx-container nx-detail-page u051-detail">
  <div className="nx-detail-actions">{!auction && <button ref={cartRef} type="button" className="u051-detail-cart" onClick={() => navigate('/cart')}>🛒 Giỏ hàng <b ref={badgeRef}>{added ? '✓' : '→'}</b></button>}
   <HeartBurstButton pressed={false} onToggle={() => unsupported('Watchlist')} label="Lưu vào Watchlist" text="Lưu vào Watchlist" /><button onClick={share}>↗ Chia sẻ</button></div>
  <div className="nx-detail-grid"><ProductGallery product={product} detail={detail} />

   <ProductPurchase product={product} detail={detail} /><ProductAssurance /></div>

   <div className="nx-detail-bottom"><div><section className="nx-panel nx-description"><h2>Mô tả sản phẩm</h2><RichTextContent className="nx-description-content" value={product.description} fallback="Chưa có mô tả." /><div className="nx-description-highlights"><div><h3>Danh mục</h3><p>{product.categoryName || 'Chưa có dữ liệu'}</p></div><div><h3>Phụ kiện và bảo hành</h3><p>Chưa có dữ liệu từ máy chủ.</p></div></div></section>
    <section className="nx-panel nx-specs"><h2>Thông tin sản phẩm</h2><table><tbody>{[['Danh mục', product.categoryName || '—'], ['Trạng thái', product.status], ['Ngày tạo', new Date(product.createdAt).toLocaleString('vi-VN')], ['Cập nhật', new Date(product.updatedAt).toLocaleString('vi-VN')]].map(([key,value]) => <tr key={key}><th>{key}</th><td>{value}</td></tr>)}</tbody></table></section></div>
    <ProductReviews detail={detail} /></div>
 </main>;
}
export default ProductDetailPage;
