import type { useProductDetail } from '../hooks/useProductDetail';

type Props = { detail: ReturnType<typeof useProductDetail> };

export default function ProductReviews({ detail }: Props) {
 const { reviewError, reviews, reviewPage, setReviewPage } = detail;
 return <aside className="nx-panel nx-reviews"><div className="nx-section-heading"><h2>Đánh giá từ người mua</h2><strong>— <small>Chưa có tổng hợp</small></strong></div><p className="nx-muted">Máy chủ chưa cung cấp điểm trung bình hoặc phân bố đánh giá.</p>{[5, 4, 3].map(score => <div className="nx-rating-bar" key={score}><span>{score} sao</span><div><span style={{ width: '0%' }} /></div><span>—</span></div>)}{reviewError ? <p role="alert">{reviewError}</p> : !reviews ? <p role="status">Đang tải đánh giá…</p> : <><p className="nx-muted">{reviews.totalElements} đánh giá</p>{reviews.content.length ? reviews.content.map(item => <article className="nx-review" key={item.id}><b>{item.buyerId}</b><small>{new Date(item.createdAt).toLocaleString('vi-VN')}</small><div className="nx-stars">{item.score}/5 ★</div><p>{item.comment || 'Không có nhận xét.'}</p></article>) : <p>Chưa có đánh giá.</p>}<button className="nx-button nx-button-soft" disabled={reviewPage === 0} onClick={() => setReviewPage(value => value - 1)}>Trước</button><button className="nx-button nx-button-soft" disabled={reviewPage + 1 >= reviews.totalPages} onClick={() => setReviewPage(value => value + 1)}>Tiếp</button></>}</aside>;
}
