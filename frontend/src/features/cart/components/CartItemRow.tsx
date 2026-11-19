import { memo } from 'react';
import type { CartItem } from '../types/cart';
import { formatVnd } from '../utils/cart.format';
import QuantityStepper from '../../../shared/components/QuantityStepper/QuantityStepper';
interface Props { item: CartItem; onQuantityChange: (id: string, quantity: number) => void; onRemove: (id: string) => void; onRetry?: (id: string) => void }
function CartItemRow({ item, onQuantityChange, onRemove, onRetry }: Props) {
  return <article className="nx-cart-item">
    <div className="nx-cart-item-main"><div className="nx-cart-thumb">{item.image ? <img src={item.image} alt={item.name} /> : <i className="bi bi-image" aria-hidden="true" />}</div>
      <div className="nx-cart-item-body"><h3 className="nx-cart-item-title">{item.name}</h3>{item.variant && <p className="nx-cart-item-meta">Phân loại: {item.variant}</p>}
        <button type="button" className="nx-cart-link-btn nx-cart-link-btn--danger" onClick={() => onRemove(item.id)}>Xóa</button>
      </div>
    </div>
    <div className="nx-cart-item-side"><span className="nx-cart-price">{formatVnd(item.unitPrice)}</span>
      <QuantityStepper value={item.quantity} max={item.maxQuantity} label={item.name} onChange={next => onQuantityChange(item.id, next)} />
      {item.stockState === 'out_of_stock' && <p className="nx-cart-sync-note nx-cart-sync-note--warn" role="status">Sản phẩm đã hết hàng.</p>}
      {item.stockState === 'insufficient' && item.quantity >= item.maxQuantity && <p className="nx-cart-sync-note nx-cart-sync-note--warn" role="status">Chỉ còn {item.maxQuantity} sản phẩm trong kho.</p>}
      {(item.syncState === 'pending' || item.syncState === 'syncing') && <p className="nx-cart-sync-note" role="status">Đang đồng bộ…</p>}
      {item.syncState === 'error' && <p className="nx-cart-sync-note nx-cart-sync-note--error" role="alert">Chưa lưu được số lượng. {onRetry && <button type="button" className="nx-cart-link-btn" onClick={() => onRetry(item.id)}>Thử lại</button>}</p>}
    </div>
  </article>;
}
export default memo(CartItemRow);

