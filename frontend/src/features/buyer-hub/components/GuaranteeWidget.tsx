import type { GuaranteeItem } from '../types/buyerHub';

interface GuaranteeWidgetProps {
  title: string;
  subtitle: string;
  items: GuaranteeItem[];
  linkLabel: string;
  onLink: () => void;
}

/** Aside widget 2 — Nexus Guarantee / buyer protection summary. */
export default function GuaranteeWidget({
  title,
  subtitle,
  items,
  linkLabel,
  onLink,
}: GuaranteeWidgetProps) {
  return (
    <section className="nx-hub-widget">
      <div className="nx-hub-guarantee-head">
        <div className="nx-hub-guarantee-icon">
          <i className="bi bi-shield-check" aria-hidden="true"></i>
        </div>
        <div>
          <h4 className="nx-hub-widget-heading">{title}</h4>
          <p className="nx-hub-widget-subtext">{subtitle}</p>
        </div>
      </div>

      <ul className="nx-hub-guarantee-list">
        {items.map((item) => (
          <li key={item.id}>
            <i className={`bi ${item.icon}`} aria-hidden="true"></i>
            <span>
              <strong>{item.title}</strong>
              {item.body}
            </span>
          </li>
        ))}
      </ul>

      <div className="nx-hub-widget-footer">
        <button type="button" className="nx-hub-widget-link" onClick={onLink}>
          {linkLabel}
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
    </section>
  );
}
