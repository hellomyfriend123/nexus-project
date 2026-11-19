import type { useProductDetail } from '../hooks/useProductDetail';

type Props = { detail: ReturnType<typeof useProductDetail> };

export default function ProductReviews({ detail }: Props) {
 const { reviewError, reviews, reviewPage, setReviewPage } = detail;
 return <aside className="nx-panel nx-reviews"><div className="nx-section-heading"><h2>Đánh giá từ người mua</h2>{reviews && <span>{reviews.totalElements} đánh giá</span>}</div>{reviewError ? <p role="alert">{reviewError}</p> : !reviews ? <p role="status">Đang tải đánh giá…</p> : <>{reviews.content.length ? reviews.content.map(item => <article className="nx-review" key={item.id}><b>Người mua · {item.buyerId.slice(0, 8)}</b><small>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</small><div className="nx-stars">{item.score}/5 ★</div><p>{item.comment || 'Không có nhận xét.'}</p></article>) : <p>Chưa có đánh giá cho sản phẩm này.</p>}{reviews.totalPages > 1 && <nav aria-label="Trang đánh giá"><button className="nx-button nx-button-soft" disabled={reviewPage === 0} onClick={() => setReviewPage(value => value - 1)}>Trước</button><span> {reviewPage + 1} / {reviews.totalPages} </span><button className="nx-button nx-button-soft" disabled={reviewPage + 1 >= reviews.totalPages} onClick={() => setReviewPage(value => value + 1)}>Tiếp</button></nav>}</>}</aside>;
}
