import { useEffect, useId, useRef, useState } from 'react';
import type { Listing } from '../../../services/api/catalog';
import HomeProductCard from './HomeProductCard';
import { HOME_CAROUSEL_LIMIT } from '../constants/homeContent';
import '../styles/home-product-pager.css';

interface Props {
  products: Listing[];
  label: string;
  loading?: boolean;
  error?: string;
}

export default function HomeProductPager({ products, label, loading = false, error = '' }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const items = products.slice(0, HOME_CAROUSEL_LIMIT);
  const id = useId();
  const [edges, setEdges] = useState({ previous: false, next: false });
  function measure() {
    const element = track.current;
    setEdges({ previous: !!element && element.scrollLeft > 2, next: !!element && element.scrollLeft + element.clientWidth < element.scrollWidth - 2 });
  }
  useEffect(() => {
    const element = track.current;
    if (!element) { measure(); return; }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [products, loading, error]);

  function move(direction: -1 | 1) {
    const element = track.current;
    if (element && (direction < 0 ? edges.previous : edges.next)) {
      const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
      element.scrollBy({ left: direction * (element.clientWidth + gap), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }

  const previous = edges.previous;
  const next = edges.next;
  return <div className="nx-home-product-pager" role="region" aria-roledescription="carousel" aria-label={label}>
    <div className="nx-home-pager-carousel">
      {error ? <p id={id} className="nx-home-state" role="alert">{error}</p> : !loading && !products.length ? <div id={id} className="nx-home-state" role="status">Chưa có {label.toLocaleLowerCase('vi-VN')}.</div> :
        <div ref={track} id={id} className="nx-home-products nx-home-pager-track" onScroll={measure} aria-busy={loading} tabIndex={0} aria-label={`Danh sách ${label.toLocaleLowerCase('vi-VN')}`}>
          {loading ? Array.from({ length: 5 }, (_, index) => <div className="nx-home-card" aria-hidden="true" key={index}><div className="nx-home-card__media" /><div className="nx-home-card__skeleton"><span /><span /><span /></div></div>) : items.map(product => <HomeProductCard key={product.auction?.id ?? product.id} product={product} />)}
        </div>}
      {!loading && !error && (previous || next) && <>
        <button type="button" className="nx-home-pager-arrow nx-home-pager-previous" aria-label={`${label}: trước`} aria-controls={id} disabled={loading || !previous} onClick={() => move(-1)}><i className="bi bi-chevron-left" aria-hidden="true" /></button>
        <button type="button" className="nx-home-pager-arrow nx-home-pager-next" aria-label={`${label}: tiếp theo`} aria-controls={id} disabled={loading || !next} onClick={() => move(1)}><i className="bi bi-chevron-right" aria-hidden="true" /></button>
      </>}
    </div>
    <span className="visually-hidden" role="status">{loading ? `Đang tải ${label.toLocaleLowerCase('vi-VN')}` : `${label}: ${items.length} sản phẩm`}</span>
  </div>;
}
