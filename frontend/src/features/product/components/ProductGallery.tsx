import type { CatalogProductDetail } from '../../../services/api/catalog';
import type { useProductDetail } from '../hooks/useProductDetail';
import { CatalogImage } from './CatalogProductCard';

type Props = { product: CatalogProductDetail; detail: ReturnType<typeof useProductDetail> };

export default function ProductGallery({ product, detail }: Props) {
 const { auction, imageRef, images, image, setImage } = detail;
 return <section className="nx-gallery"><div className="nx-gallery-main"><div className="nx-gallery-badges"><b>{auction ? auction.status : product.status}</b><span>Ảnh sản phẩm</span></div>
   <div ref={imageRef}><CatalogImage url={images[image] ?? null} name={product.name} /></div><div className="nx-authenticated"><strong>Thông tin từ người bán</strong><small>Máy chủ chưa cung cấp kết quả kiểm định.</small></div></div>
   <div className="nx-thumbnails">{images.map((url, index) => <button key={url + index} className={image === index ? 'is-active' : ''} onClick={() => setImage(index)} aria-label={'Xem ảnh ' + (index + 1)} aria-pressed={image === index}><CatalogImage url={url} name={product.name} /></button>)}</div>
   <div className="nx-panel nx-condition"><h3>THÔNG TIN KIỂM ĐỊNH</h3><div>Thân vỏ: Chưa có dữ liệu <span>Vòng xoay: Chưa có dữ liệu</span></div><div>Lá khẩu: Chưa có dữ liệu <span>Ngoại hình: Chưa có dữ liệu</span></div></div></section>;
}
