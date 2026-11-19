import { AdminAuctionsDetailsModal } from './AdminAuctionsDetailsModal';
import { AdminAuctionsFilters } from './AdminAuctionsFilters';
import { AdminAuctionsTable } from './AdminAuctionsTable';
import { AdminAuctionsHeader } from './AdminAuctionsHeader';
import type { useAdminAuctions } from '../hooks/useAdminAuctions';

export function AdminAuctionsView(model: ReturnType<typeof useAdminAuctions>) {
  const { error } = model;
  return (
    <div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <AdminAuctionsHeader {...model} />

      {/* Filter Tabs */}
      <AdminAuctionsFilters {...model} />

      {/* Auctions Table */}
      <div className="nx-admin-card">
        <div className="nx-table-container">
          <AdminAuctionsTable {...model} />
        </div>
      </div>

      {/* Task A-1: View Auction Details & Bid History Modal */}
      <AdminAuctionsDetailsModal {...model} />
    </div>
  );
}
