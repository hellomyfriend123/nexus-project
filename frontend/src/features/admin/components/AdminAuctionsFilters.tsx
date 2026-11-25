import type { useAdminAuctions } from '../hooks/useAdminAuctions';

export function AdminAuctionsFilters(model: ReturnType<typeof useAdminAuctions>) {
  const { statusFilter, setStatusFilter, keyword, setKeyword, filteredAuctions } = model;
  return (
    <div className="nx-filter-bar" style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
            aria-pressed={statusFilter === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm sản phẩm, người bán, người trả giá..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: '270px' }}
        />
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          Hiển thị <strong>{filteredAuctions.length}</strong> phiên
        </span>
      </div>
    </div>
  );
}
