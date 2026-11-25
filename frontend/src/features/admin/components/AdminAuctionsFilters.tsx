import type { useAdminAuctions } from '../hooks/useAdminAuctions';

export function AdminAuctionsFilters(model: ReturnType<typeof useAdminAuctions>) {
  const { statusFilter, setStatusFilter } = model;
  return (
    <div className="nx-card" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'SCHEDULED', label: 'Sắp diễn ra' },
          { key: 'ACTIVE', label: 'Đang diễn ra' },
          { key: 'ENDED', label: 'Đã kết thúc' },
          { key: 'CANCELLED', label: 'Đã huỷ' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`nx-btn nx-btn-sm ${
              statusFilter === tab.key ? 'nx-btn-primary' : 'nx-btn-outline'
            }`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
