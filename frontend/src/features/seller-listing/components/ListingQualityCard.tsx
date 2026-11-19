import { listingQualityItems } from '../services/listingQuality.mock';

// Aside 1 — Điểm chất lượng tin đăng.
export default function ListingQualityCard({ score, label }: { score: number; label: string }) {
  return (
    <section className="nx-listing-card nx-listing-aside-card">
      <header className="nx-listing-aside-head">
        <h3>Chất lượng tin đăng</h3>
        <span className="nx-listing-tag is-primary">{label}</span>
      </header>

      <div className="nx-listing-score">
        <div className="nx-listing-gauge">
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <circle className="nx-listing-gauge-track" cx="18" cy="18" r="15.9155" />
            <circle
              className="nx-listing-gauge-value"
              cx="18"
              cy="18"
              r="15.9155"
              strokeDasharray={`${score}, 100`}
            />
          </svg>
          <div className="nx-listing-gauge-label">
            <strong>N/A</strong>
            <span>/100</span>
          </div>
        </div>
        <div>
          <p className="nx-listing-score-title">Chưa có đánh giá từ hệ thống</p>
          <p className="nx-listing-score-caption">
            Chấm chất lượng và xác minh tin đăng chưa được hỗ trợ.
          </p>
        </div>
      </div>

      <ul className="nx-listing-checklist">
        {listingQualityItems.map(item => (
          <li key={item.id} className={false ? 'is-done' : 'is-pending'}>
            <i
              className={`bi ${item.done ? 'bi-check-circle-fill' : 'bi-hourglass-split'}`}
              aria-hidden="true"
            />
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
