import FilterChips from './FilterChips';
import type { AuctionFilterId, FilterChipOption } from '../types/buyerHub';

interface AuctionFilterBarProps {
  filters: FilterChipOption<AuctionFilterId>[];
  activeFilter: AuctionFilterId;
  search: string;
  filterLabel: string;
  searchPlaceholder: string;
  onFilterChange: (id: AuctionFilterId) => void;
  onSearchChange: (value: string) => void;
}

export default function AuctionFilterBar({
  filters,
  activeFilter,
  search,
  filterLabel,
  searchPlaceholder,
  onFilterChange,
  onSearchChange,
}: AuctionFilterBarProps) {
  return (
    <div className="nx-hub-filter-bar">
      <div className="nx-hub-filter-row">
        <div className="nx-hub-filter-group">
          <span className="nx-hub-filter-label">{filterLabel}</span>
          <FilterChips
            options={filters}
            activeId={activeFilter}
            onSelect={onFilterChange}
            variant="filled"
            ariaLabel="Lọc phiên đấu giá theo trạng thái"
          />
        </div>

        <div className="nx-hub-search">
          <i className="bi bi-search" aria-hidden="true"></i>
          <input
            type="text"
            className="nx-hub-search-input"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
