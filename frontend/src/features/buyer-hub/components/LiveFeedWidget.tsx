import type { LiveFeedItem } from '../types/buyerHub';

interface LiveFeedWidgetProps {
  title: string;
  items: LiveFeedItem[];
  onAction: () => void;
}

/** Aside widget 1 — in-app urgency feed (outbid / shipping / own-auction alerts). */
export default function LiveFeedWidget({ title, items, onAction }: LiveFeedWidgetProps) {
  return (
    <section className="nx-hub-widget">
      <div className="nx-hub-widget-head">
        <h3 className="nx-hub-widget-title">
          <i className="bi bi-broadcast" aria-hidden="true"></i>
          {title}
        </h3>
        <span className="nx-hub-dot nx-hub-dot--ping" aria-hidden="true"></span>
      </div>

      <div className="nx-hub-feed-list">
        {items.map((item) => (
          <div
            key={item.id}
            className={`nx-hub-feed-item nx-hub-feed-item--${item.kind}`}
          >
            <div className={`nx-hub-feed-label nx-hub-feed-label--${item.kind}`}>
              <span>{item.label}</span>
              <span>{item.timeAgo}</span>
            </div>

            <p className="nx-hub-feed-text">
              {item.parts.map((part, index) =>
                part.strong ? (
                  <strong key={index}>{part.text}</strong>
                ) : (
                  <span key={index}>{part.text}</span>
                ),
              )}
            </p>

            {item.kind === 'outbid' && item.actionLabel ? (
              <button type="button" className="nx-hub-feed-btn" onClick={onAction}>
                {item.actionLabel}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
