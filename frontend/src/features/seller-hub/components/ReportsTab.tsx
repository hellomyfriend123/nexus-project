import type { SellerHubState } from '../hooks/useSellerHub';
import { formatSellerMoney } from '../constants/sellerHub.constants';
import { sellerReportKpis, sellerRevenueSeries, sellerReviews, sellerTopSkus, shopRating, sellerReviewKpis } from '../services/sellerReporting';

const ranges = [{ id: '3m', label: '3 tháng' }, { id: '6m', label: '6 tháng' }, { id: '12m', label: '12 tháng' }];

function Stars({ value }: { value: number }) {
  return <span className="nx-seller-stars" aria-label={`${value} trên 5 sao`}>{[1, 2, 3, 4, 5].map(star =>
    <i key={star} className={`bi bi-star-fill ${star <= value ? '' : 'is-empty'}`} aria-hidden="true" />)}</span>;
}

export default function ReportsTab({ hub }: { hub: SellerHubState }) {
  return <section role="tabpanel" id="hub-panel-reports" aria-labelledby="hub-tab-reports" className="nx-seller-panel">
    <div className="nx-seller-panel-heading"><div><h2>Báo Cáo & Đánh Giá Shop</h2><p>Hiệu quả kinh doanh và phản hồi khách hàng trong kỳ kinh doanh gần nhất.</p></div>
      <div className="nx-seller-chips nx-seller-chips--compact" role="group" aria-label="Chọn khoảng thời gian báo cáo">{ranges.map(range =>
        <button key={range.id} type="button" className={`nx-seller-chip ${hub.reportRange === range.id ? 'is-active' : ''}`} aria-pressed={hub.reportRange === range.id} onClick={() => { hub.setReportRange(range.id); hub.mockAction(`Báo cáo ${range.label}`); }}>{range.label}</button>)}
      </div></div>
    <div className="nx-seller-panel-kpis" aria-label="Chỉ số báo cáo">{sellerReportKpis.map(kpi => <article className={`nx-seller-panel-kpi nx-seller-panel-kpi--${kpi.tone}`} key={kpi.label}>
      <div><h3>{kpi.label}</h3><p>{kpi.value} <small>{kpi.unit}</small></p><span>{kpi.caption}</span></div><i className={`bi bi-${kpi.icon}`} aria-hidden="true" />
    </article>)}</div>
    <div className="nx-seller-report-grid">
      <section className="nx-seller-report-card" aria-labelledby="revenue-title">
        <div className="nx-seller-report-head"><div><h3 id="revenue-title">Doanh thu theo tháng</h3><p>Đơn vị: đồng (VND)</p></div><button className="nx-seller-text-button" onClick={() => hub.mockAction('Xuất báo cáo doanh thu')}><i className="bi bi-download" aria-hidden="true" /> Xuất báo cáo</button></div>
        <div className="nx-seller-chart" role="img" aria-label="Chưa có API báo cáo doanh thu — các cột chỉ là khung trống">{sellerRevenueSeries.map(point =>
          <div className="nx-seller-chart-col" key={point.label}>
            <span className="nx-seller-chart-value">—</span>
            <div className="nx-seller-chart-track"><span style={{ height: '0%' }} className={point.label === 'T3' ? 'is-current' : ''} /></div>
            <span className="nx-seller-chart-label">{point.label}</span>
            <small className={point.growth.startsWith('-') ? 'nx-seller-red-text' : 'nx-seller-blue-text'}>{point.growth}</small>
          </div>)}</div>
      </section>
      <section className="nx-seller-report-card" aria-labelledby="rating-title">
        <div className="nx-seller-report-head"><div><h3 id="rating-title">Điểm đánh giá shop</h3><p>Chỉ tính đánh giá đã xác thực đơn hàng</p></div></div>
        <div className="nx-seller-rating-summary"><div className="nx-seller-rating-score"><strong>{shopRating.score}</strong><Stars value={0} /><small>{shopRating.total}</small></div>
          <ul className="nx-seller-rating-bars">{shopRating.stars.map(row => <li key={row.star}><span>{row.star} <i className="bi bi-star-fill" aria-hidden="true" /></span><div className="nx-seller-meter"><span style={{ width: `${row.percent}%` }} /></div><small>—</small></li>)}</ul></div>
        <div className="nx-seller-rating-foot"><strong className="nx-seller-blue-text">{sellerReviewKpis.replyRate}</strong><span>{sellerReviewKpis.replyNote}</span><span className="nx-seller-red-text">{sellerReviewKpis.responseNote}</span></div>
      </section>
    </div>
    <section className="nx-seller-report-card" aria-labelledby="top-sku-title">
      <div className="nx-seller-report-head"><div><h3 id="top-sku-title">Sản phẩm bán chạy nhất</h3><p>Xếp theo doanh thu trong kỳ</p></div><button className="nx-seller-text-button" onClick={() => hub.mockAction('Xem toàn bộ SKU')}>Xem toàn bộ SKU</button></div>
      <div className="nx-seller-table-wrap"><table className="nx-seller-table nx-seller-table--report"><thead><tr><th>Sản phẩm</th><th>Đã bán</th><th>Doanh thu</th><th>Tăng trưởng</th></tr></thead><tbody>{sellerTopSkus.map(sku => <tr key={sku.id}>
        <td><div className="nx-seller-order-cell"><strong>{sku.name}</strong><small className="nx-seller-sku">{sku.sku}</small></div></td>
        <td>{sku.sold}</td>
        <td><strong className="nx-seller-price">{formatSellerMoney(sku.revenue)}</strong></td>
        <td><span className={`nx-seller-trend nx-seller-trend--${sku.tone}`}><i className={`bi bi-arrow-${sku.tone === 'down' ? 'down' : 'up'}-right`} aria-hidden="true" /> {sku.trend}</span></td>
      </tr>)}{!sellerTopSkus.length&&<tr><td colSpan={4} className="nx-seller-empty">Chưa có API báo cáo sản phẩm bán chạy.</td></tr>}</tbody></table></div>
    </section>
    <section className="nx-seller-report-card" aria-labelledby="reviews-title">
      <div className="nx-seller-report-head"><div><h3 id="reviews-title">Đánh giá gần đây của khách hàng</h3><p>{sellerReviews.filter(review => !review.replied).length} đánh giá chưa phản hồi</p></div><button className="nx-seller-text-button" onClick={() => hub.mockAction('Xem tất cả đánh giá')}>Xem tất cả</button></div>
      <ul className="nx-seller-reviews">{sellerReviews.map(review => <li key={review.id}>
        <div className="nx-seller-review-head"><strong>{review.buyer}</strong><Stars value={review.rating} /><small>{review.time}</small></div>
        <p className="nx-seller-review-product"><i className="bi bi-bag" aria-hidden="true" /> {review.product}</p>
        <p>{review.text}</p>
        <div className="nx-seller-review-foot">{review.replied ? <span className="nx-seller-state nx-seller-state--live">Đã phản hồi</span> : <button className="nx-seller-text-button" onClick={() => hub.mockAction(`Phản hồi đánh giá của ${review.buyer}`)}>Phản hồi ngay</button>}</div>
      </li>)}{!sellerReviews.length&&<li className="nx-seller-empty">Chưa có API đánh giá người bán.</li>}</ul>
    </section>
  </section>;
}
