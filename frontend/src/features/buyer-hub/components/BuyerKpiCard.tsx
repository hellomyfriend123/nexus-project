import type { BuyerKpi } from '../types/buyerHub';
import { formatCountdown, formatVnd } from '../utils/buyerHub.format';

interface BuyerKpiCardProps {
  kpi: BuyerKpi;
  /** Seconds left to pay for a won auction; only card 3 renders a timer. */
  timerSeconds: number;
}

const iconToneClass: Record<BuyerKpi['iconTone'], string> = {
  primary: 'nx-hub-kpi-icon--primary',
  secondary: 'nx-hub-kpi-icon--secondary',
  highlight: 'nx-hub-kpi-icon--highlight',
  accent: 'nx-hub-kpi-icon--accent',
};

export default function BuyerKpiCard({ kpi, timerSeconds }: BuyerKpiCardProps) {
  return (
    <article className={`nx-hub-kpi${kpi.emphasis ? ' nx-hub-kpi--emphasis' : ''}`}>
      <div className="nx-hub-kpi-body">
        <p className="nx-hub-kpi-label">{kpi.label}</p>
        <p
          className={`nx-hub-kpi-value${
            kpi.valueTone === 'secondary' ? ' nx-hub-kpi-value--secondary' : ''
          }`}
        >
          {kpi.value}
          <span className="nx-hub-kpi-unit">{kpi.unit}</span>
        </p>

        {kpi.pill && (
          <span
            className={`nx-hub-kpi-pill nx-hub-kpi-pill--${kpi.pillTone ?? 'primary'}`}
          >
            {kpi.pill.pulse ? (
              <span className="nx-hub-dot" aria-hidden="true"></span>
            ) : (
              <i className={`bi ${kpi.pill.icon ?? 'bi-dot'}`} aria-hidden="true"></i>
            )}
            {kpi.pill.text}
          </span>
        )}

        {kpi.timer && (
          <p className="nx-hub-kpi-timer">
            <i className={`bi ${kpi.timer.icon}`} aria-hidden="true"></i>
            {kpi.timer.prefix} {formatCountdown(timerSeconds)}
          </p>
        )}

        {kpi.caption && (
          <p className="nx-hub-kpi-caption">
            {kpi.caption.label} <strong>{formatVnd(kpi.caption.value)}</strong>
          </p>
        )}
      </div>

      <span className={`nx-hub-kpi-icon ${iconToneClass[kpi.iconTone]}`} aria-hidden="true">
        <i className={`bi ${kpi.icon}`}></i>
      </span>
    </article>
  );
}
