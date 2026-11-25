import type { AuctionMetric } from '../types/auctionResult';

export default function AuctionMetrics({ metrics }: { metrics: AuctionMetric[] }) {
  return (
    <div className="nx-ar-finances" aria-label="Tổng quan kết quả đấu giá">{metrics.map(metric => (
      <div className={metric.highlighted ? 'nx-ar-net' : undefined} key={metric.label}>
        <span>{metric.label}</span>
        <strong>{metric.value}</strong>
        <small>{metric.caption}</small>
      </div>
      ))}
    </div>
  );
}
