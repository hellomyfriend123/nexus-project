import SavedItemRow from './SavedItemRow';
import { formatVnd } from '../utils/buyerHub.format';
import type { SavedItem } from '../types/buyerHub';

interface SavedCartTabProps {
  title: string;
  summary: string;
  selectAllLabel: string;
  items: SavedItem[];
  selectedCount?: number;
  subtotal?: number;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onMoveToCart: (id: string) => void;
  onCheckout?: () => void;
}

export default function SavedCartTab({
  title,
  summary,
  selectAllLabel,
  items,
  selectedCount = 0,
  subtotal = 0,
  onToggle,
  onSelectAll,
  onQuantityChange,
  onRemove,
  onMoveToCart,
  onCheckout,
}: SavedCartTabProps) {
  const allSelected = items.length > 0 && items.every((item) => item.selected);
  const hasSelectedItems = selectedCount > 0;

  return (
    <section
      className="nx-hub-panel nx-hub-panel--card"
      id="hub-panel-cart"
      role="tabpanel"
      aria-labelledby="hub-tab-cart"
      tabIndex={0}
    >
      <div className="nx-hub-saved-head">
        <div>
          <h3 className="nx-hub-saved-title">{title}</h3>
          <p className="nx-hub-saved-summary">{summary}</p>
        </div>
        <button
          type="button"
          className="nx-hub-saved-selectall"
          aria-pressed={allSelected}
          onClick={onSelectAll}
        >
          {selectAllLabel}
        </button>
      </div>

      <div className="nx-hub-saved-list">
        {items.length === 0 ? (
          <p className="nx-hub-empty">Chưa có sản phẩm đã lưu. Lưu sản phẩm từ danh mục để xem tại đây.</p>
        ) : (
          items.map((item) => (
            <SavedItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
              onMoveToCart={onMoveToCart}
            />
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="nx-hub-saved-footer">
          <div className="nx-hub-saved-checkout-meta" aria-live="polite">
            <span>Đã chọn {selectedCount} mục</span>
            <strong>{formatVnd(subtotal)}</strong>
          </div>

          <button
            type="button"
            className="nx-hub-saved-checkout"
            onClick={onCheckout}
            disabled={!hasSelectedItems || !onCheckout}
          >
            Chuyển đã chọn vào giỏ hàng
          </button>
        </div>
      )}
    </section>
  );
}
