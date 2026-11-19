import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceTabs(model: ReturnType<typeof useAdminCommerce>) {
  const { activeTab, setActiveTab } = model;
  return (
    <div className="nx-tabs">
      <button
        type="button"
        className={`nx-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
        onClick={() => setActiveTab('orders')}
      >
        <i className="bi bi-receipt me-1"></i> Đơn hàng
      </button>
      <button
        type="button"
        className={`nx-tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
        onClick={() => setActiveTab('campaigns')}
      >
        <i className="bi bi-megaphone me-1"></i> Chiến dịch khuyến mãi
      </button>
      <button
        type="button"
        className={`nx-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
        onClick={() => setActiveTab('coupons')}
      >
        <i className="bi bi-ticket-perforated me-1"></i> Mã giảm giá & Voucher
      </button>
    </div>
  );
}
