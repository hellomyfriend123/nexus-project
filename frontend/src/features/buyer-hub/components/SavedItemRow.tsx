import type { SavedItem } from '../types/buyerHub';
import { formatVnd } from '../utils/buyerHub.format';

interface SavedItemRowProps {
  item: SavedItem;
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onMoveToCart: (id: string) => void;
}

export default function SavedItemRow({
  item,
  onToggle,
  onQuantityChange,
  onRemove,
  onMoveToCart,
}: SavedItemRowProps) {
  return (
    <div className="nx-hub-saved-row">
      <div className="nx-hub-saved-main">
        <input
          type="checkbox"
          className="nx-hub-checkbox"
          checked={item.selected}
          disabled={item.maxQuantity < 1}
          onChange={() => onToggle(item.id)}
          aria-label={`Chọn ${item.name} để chuyển vào giỏ`}
        />

        <div className="nx-hub-saved-thumb">
          <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div className="nx-hub-saved-body">
          <h4 className="nx-hub-saved-name">{item.name}</h4>
          <p className="nx-hub-saved-meta">
            Đơn vị bán: {item.seller} • Tình trạng: {item.condition}
          </p>
          <span className="nx-hub-saved-price">{formatVnd(item.unitPrice)}</span>
        </div>
      </div>

      <div className="nx-hub-saved-side">
        <button type="button" className="nx-hub-bid-btn nx-hub-bid-btn--plain"
          disabled={item.maxQuantity < 1} onClick={() => onMoveToCart(item.id)}>
          {item.maxQuantity < 1 ? 'Hết hàng' : 'Chuyển vào giỏ hàng'}
        </button>
        <div className="nx-hub-qty" role="group" aria-label={`Số lượng ${item.name}`}>
          <button
            type="button"
            className="nx-hub-qty-btn nx-hub-qty-btn--left"
            onClick={() => onQuantityChange(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1 || item.maxQuantity < 1}
            aria-label={`Giảm số lượng ${item.name}`}
          >
            -
          </button>
          <span className="nx-hub-qty-value" aria-live="polite">
            {item.quantity}
          </span>
          <button
            type="button"
            className="nx-hub-qty-btn nx-hub-qty-btn--right"
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            disabled={item.quantity >= item.maxQuantity}
            aria-label={`Tăng số lượng ${item.name}`}
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="nx-hub-saved-remove"
          title="Bỏ lưu sản phẩm"
          aria-label="Bỏ lưu sản phẩm"
          onClick={() => onRemove(item.id)}
        >
          <i className="bi bi-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}
