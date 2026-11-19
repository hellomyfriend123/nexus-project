import { Link } from 'react-router-dom';
import type { AuctionProduct, AuctionSummary, Outcome } from '../types/auctionResult';
export default function ResultCard({ product, summary }: { product: AuctionProduct; summary: AuctionSummary; outcome: Outcome }) {
  return <section className="ar-panel ar-product-card" aria-label="Sản phẩm đấu giá"><div className="ar-product-photo">{product.image ? <img src={product.image} alt={product.title} /> : <span>Chưa có ảnh sản phẩm</span>}</div><div className="ar-product-info"><p className="ar-eyebrow">SẢN PHẨM ĐẤU GIÁ</p><h2>{product.title}</h2><Link to={'/products/' + product.id + '?auctionId=' + summary.auctionId}>Xem thông tin sản phẩm →</Link></div></section>;
}

