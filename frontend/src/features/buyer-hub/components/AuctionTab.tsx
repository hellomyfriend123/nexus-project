import AuctionFilterBar from './AuctionFilterBar';
import BidRow from './BidRow';
import type { AuctionFilterId, BuyerBid, FilterChipOption } from '../types/buyerHub';

interface AuctionTabProps {
  filters: FilterChipOption<AuctionFilterId>[];
  activeFilter: AuctionFilterId;
  search: string;
  filterLabel: string;
  searchPlaceholder: string;
  bids: BuyerBid[];
  onFilterChange: (id: AuctionFilterId) => void;
  onSearchChange: (value: string) => void;
  onBidAction: (bid: BuyerBid) => void;
  onBidHistory: (label: string) => void;
}

export default function AuctionTab({
  filters,
  activeFilter,
  search,
  filterLabel,
  searchPlaceholder,
  bids,
  onFilterChange,
  onSearchChange,
  onBidAction,
  onBidHistory,
}: AuctionTabProps) {
  return (
    <section
      className="nx-hub-panel"
      id="hub-panel-auctions"
      role="tabpanel"
      aria-labelledby="hub-tab-auctions"
      tabIndex={0}
    >
      <AuctionFilterBar
        filters={filters}
        activeFilter={activeFilter}
        search={search}
        filterLabel={filterLabel}
        searchPlaceholder={searchPlaceholder}
        onFilterChange={onFilterChange}
        onSearchChange={onSearchChange}
      />

      <div className="nx-hub-bid-list">
        {bids.length === 0 ? (
          <p className="nx-hub-empty">Không có phiên đấu giá nào khớp bộ lọc hiện tại.</p>
        ) : (
          bids.map((bid) => (
            <BidRow
              key={bid.id}
              bid={bid}
              onAction={onBidAction}
              onIconAction={onBidHistory}
            />
          ))
        )}
      </div>
    </section>
  );
}
