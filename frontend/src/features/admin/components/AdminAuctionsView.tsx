import AdminStatCard from './AdminStatCard';
import { AdminAuctionsDetailsModal } from './AdminAuctionsDetailsModal';
import { AdminAuctionsFilters } from './AdminAuctionsFilters';
import { AdminAuctionsTable } from './AdminAuctionsTable';
import { AdminAuctionsHeader } from './AdminAuctionsHeader';
import type { useAdminAuctions } from '../hooks/useAdminAuctions';

export function AdminAuctionsView(model: ReturnType<typeof useAdminAuctions>) {
  const { error, summary } = model;
  return (
    <div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <AdminAuctionsHeader {...model} />

      {/* Summary KPI Grid */}
      <div className="nx-stat-grid">
        <AdminStatCard
          label="Tổng số phiên đấu giá"
          value={summary.total}
          icon="bi-hammer"
          iconBg="#eff6ff"
          iconColor="#315bf4"
        />
        <AdminStatCard
          label="Đang diễn ra"
          value={summary.active}
          icon="bi-broadcast"
          iconBg="#fef2f2"
          iconColor="#dc2626"
        />
        <AdminStatCard
          label="Tổng lượt trả giá"
          value={summary.totalBids}
          icon="bi-graph-up-arrow"
          iconBg="#fffbeb"
          iconColor="#d97706"
        />
        <AdminStatCard
          label="Đã kết thúc"
          value={summary.ended}
          icon="bi-check-circle"
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
      </div>

      {/* Main Card: Filter + Table */}
      <div className="nx-admin-card">
        <AdminAuctionsFilters {...model} />

        <div className="nx-table-container">
          <AdminAuctionsTable {...model} />
        </div>
      </div>

      {/* View Auction Details & Bid History Modal */}
      <AdminAuctionsDetailsModal {...model} />
    </div>
  );
}
