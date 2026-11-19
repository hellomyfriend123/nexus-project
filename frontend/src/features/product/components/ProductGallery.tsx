import type { CatalogProductDetail } from '../../../services/api/catalog';
import type { useProductDetail } from '../hooks/useProductDetail';
import { CatalogImage } from './CatalogProductCard';

type Props = { product: CatalogProductDetail; detail: ReturnType<typeof useProductDetail> };

export default function ProductGallery({ product, detail }: Props) {
 const { auction, imageRef, images, image, setImage } = detail;
 return <section className="nx-gallery" aria-label="Ảnh sản phẩm"><div className="nx-gallery-main"><div className="nx-gallery-badges"><b>{auction ? 'Đấu giá' : 'Mua trực tiếp'}</b></div>
   <div ref={imageRef}><CatalogImage url={images[image] ?? null} name={product.name} /></div></div>
   <div className="nx-thumbnails">{images.map((url, index) => <button key={url + index} className={image === index ? 'is-active' : ''} onClick={() => setImage(index)} aria-label={'Xem ảnh ' + (index + 1)} aria-pressed={image === index}><CatalogImage url={url} name={product.name} /></button>)}</div>
   </section>;
}
