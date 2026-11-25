interface SupportWidgetProps {
  title: string;
  body: string;
  onComplaint: () => void;
  onChat: () => void;
}

/** Aside widget 3 — quick 24/7 dispute support actions. */
export default function SupportWidget({ title, body, onComplaint, onChat }: SupportWidgetProps) {
  return (
    <section className="nx-hub-widget">
      <h4 className="nx-hub-widget-label">{title}</h4>
      <p className="nx-hub-widget-subtext">{body}</p>

      <div className="nx-hub-support-actions">
        <button type="button" className="nx-hub-widget-btn" onClick={onComplaint}>
          <i className="bi bi-flag" aria-hidden="true"></i>
          Khiếu nại
        </button>
        <button
          type="button"
          className="nx-hub-widget-btn nx-hub-widget-btn--primary"
          onClick={onChat}
        >
          <i className="bi bi-headset" aria-hidden="true"></i>
          Chat hỗ trợ
        </button>
      </div>
    </section>
  );
}
