import FilterChips from './FilterChips';
import OrderRow from './OrderRow';
import type { BuyerOrder, FilterChipOption, OrderFilterId } from '../types/buyerHub';

interface OrdersTabProps {
  filters: FilterChipOption<OrderFilterId>[];
  activeFilter: OrderFilterId;
  summary: string;
  orders: BuyerOrder[];
  onFilterChange: (id: OrderFilterId) => void;
  onTrack: (code: string) => void;
  onCancel: (code: string) => void;
  onReview: (code: string) => void;
  onRebuy: (code: string) => void;
}

export default function OrdersTab({
  filters,
  activeFilter,
  summary,
  orders,
  onFilterChange,
  onTrack,
  onCancel,
  onReview,
  onRebuy,
}: OrdersTabProps) {
  return (
    <section
      className="nx-hub-panel nx-hub-panel--card"
      id="hub-panel-orders"
      role="tabpanel"
      aria-labelledby="hub-tab-orders"
      tabIndex={0}
    >
      <div className="nx-hub-order-filter">
        <FilterChips
          options={filters}
          activeId={activeFilter}
          onSelect={onFilterChange}
          variant="solid"
          ariaLabel="Lọc đơn hàng theo trạng thái"
        />
        <span className="nx-hub-order-summary">{summary}</span>
      </div>

      <div className="nx-hub-order-list">
        {orders.length === 0 ? (
          <p className="nx-hub-empty">Không có đơn hàng nào ở trạng thái này.</p>
        ) : (
          orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onTrack={onTrack}
              onCancel={onCancel}
              onReview={onReview}
              onRebuy={onRebuy}
            />
          ))
        )}
      </div>
    </section>
  );
}
