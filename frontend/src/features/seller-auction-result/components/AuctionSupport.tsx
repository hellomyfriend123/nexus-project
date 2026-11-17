export default function AuctionSupport({ onSupport }: { onSupport: () => void }) { return (
  <div className="nx-ar-help">
    <i className="bi bi-headset" aria-hidden="true" />
    <span>Cần hỗ trợ về giao dịch này?</span>
    <button title="Chưa có API hỗ trợ thao tác này" disabled onClick={onSupport}>Liên hệ Nexus</button>
  </div>
  ); }
