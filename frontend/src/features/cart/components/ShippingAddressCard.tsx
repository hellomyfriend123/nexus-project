import type { DeliveryAddress } from '../types/cart';

interface ShippingAddressCardProps {
  address: DeliveryAddress;
  /** Omit to hide the inline edit action (the section header owns it). */
  onChangeAddress?: () => void;
}

export default function ShippingAddressCard({
  address,
  onChangeAddress,
}: ShippingAddressCardProps) {
  return (
    <div className="nx-cart-address">
      <div className="nx-cart-address-icon" aria-hidden="true">
        <i className="bi bi-geo-alt"></i>
      </div>

      <div className="nx-cart-address-body">
        <div className="nx-cart-address-top">
          <span className="nx-cart-address-name">{address.receiverName}</span>
          <span className="nx-cart-address-phone">{address.phone}</span>
          {address.isDefault && (
            <span className="nx-cart-chip">Mặc định</span>
          )}
        </div>

        <p className="nx-cart-address-line">{address.line}</p>

        {address.verified && (
          <p className="nx-cart-address-verified">
            <i className="bi bi-patch-check" aria-hidden="true"></i>
            <span>
              Địa chỉ đã được định danh và tương thích giao hàng bảo hiểm Nexus
              Guarantee
            </span>
          </p>
        )}

        {onChangeAddress && (
          <button
            type="button"
            className="nx-cart-link-btn nx-cart-address-edit"
            onClick={onChangeAddress}
          >
            <i className="bi bi-pencil-square" aria-hidden="true"></i>
            <span>Thay đổi địa chỉ</span>
          </button>
        )}
      </div>
    </div>
  );
}
