import { memo } from 'react';
import type { CartItem } from '../types/cart';
import { formatVnd } from '../utils/cart.format';
import QuantityStepper from '../../../shared/components/QuantityStepper/QuantityStepper';

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater: (id: string) => void;
  onRetry?: (id: string) => void;
}

function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
  onSaveForLater,
  onRetry,
}: CartItemRowProps) {
  const isAuction = item.mode === 'auction';

  return (
    <article
      className={`nx-cart-item${isAuction ? ' nx-cart-item--auction' : ''}`}
    >
      {isAuction && <span className="nx-cart-item-accent" aria-hidden="true" />}

      <div className="nx-cart-item-main">
        <div className="nx-cart-thumb">
          {item.image ? (
            <img src={item.image} alt={item.name} />
          ) : (
            <i className="bi bi-image" aria-hidden="true"></i>
          )}
        </div>

        <div className="nx-cart-item-body">
          <div className="nx-cart-badges">
            {isAuction ? (
              <>
                <span className="nx-cart-badge nx-cart-badge--win">
                  <i className="bi bi-award" aria-hidden="true"></i>
                  Chiến thắng Đấu giá (Auction Won)
                </span>
                <span className="nx-cart-badge nx-cart-badge--locked">
                  Đã khóa giá
                </span>
              </>
            ) : (
              <>
                <span className="nx-cart-badge nx-cart-badge--bin">
                  Mua ngay (BIN)
                </span>
                {item.stockLabel && (
                  <span className="nx-cart-store">{item.stockLabel}</span>
                )}
              </>
            )}
          </div>

          <h3 className="nx-cart-item-title" title={item.name}>
            {item.name}
          </h3>

          {isAuction ? (
            <p className="nx-cart-lock-note">
              <i className="bi bi-clock-history" aria-hidden="true"></i>
              <span>{item.auctionNote}</span>
            </p>
          ) : (
            item.variant && (
              <p className="nx-cart-item-meta">
                Phân loại: <strong>{item.variant}</strong>
              </p>
            )
          )}

          {isAuction ? (
            <div className="nx-cart-item-actions">
              <span className="nx-cart-seller">
                Người bán: <strong>{item.sellerName}</strong>
                {item.sellerRating !== undefined &&
                  ` (${item.sellerRating}% Uy tín)`}
              </span>
            </div>
          ) : (
            <div className="nx-cart-item-actions">
              <button
                type="button"
                className="nx-cart-link-btn"
                onClick={() => onSaveForLater(item.id)}
              >
                <i className="bi bi-bookmark" aria-hidden="true"></i>
                <span>Lưu lại sau</span>
              </button>
              <button
                type="button"
                className="nx-cart-link-btn nx-cart-link-btn--danger"
                onClick={() => onRemove(item.id)}
              >
                <i className="bi bi-trash3" aria-hidden="true"></i>
                <span>Xóa</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="nx-cart-item-side">
        {isAuction ? (
          <>
            <div className="nx-cart-item-price-block">
              <span className="nx-cart-price nx-cart-price--auction">
                {formatVnd(item.unitPrice)}
              </span>
              <p className="nx-cart-price-note">{item.priceNote}</p>
            </div>
            <span className="nx-cart-locked-qty">
              <i className="bi bi-lock" aria-hidden="true"></i>
              <span>Số lượng: {item.quantity}</span>
            </span>
          </>
        ) : (
          <>
            <span className="nx-cart-price">{formatVnd(item.unitPrice)}</span>
            <QuantityStepper
              value={item.quantity}
              max={item.maxQuantity}
              label={item.name}
              onChange={(next) => onQuantityChange(item.id, next)}
            />
            {item.stockState === 'out_of_stock' && (
              <p className="nx-cart-sync-note nx-cart-sync-note--warn" role="status">Sản phẩm đã hết hàng.</p>
            )}
            {item.stockState === 'insufficient' && item.quantity >= item.maxQuantity && (
              <p className="nx-cart-sync-note nx-cart-sync-note--warn" role="status">Chỉ còn {item.maxQuantity} sản phẩm trong kho.</p>
            )}
            {(item.syncState === 'pending' || item.syncState === 'syncing') && (
              <p className="nx-cart-sync-note" role="status">Đang đồng bộ...</p>
            )}
            {item.syncState === 'error' && (
              <p className="nx-cart-sync-note nx-cart-sync-note--error" role="alert">
                Chưa đồng bộ với máy chủ.{' '}
                {onRetry && <button type="button" className="nx-cart-link-btn" onClick={() => onRetry(item.id)}>Thử lại</button>}
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}

export default memo(CartItemRow);
