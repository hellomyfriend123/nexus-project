import type { PaymentMethod, PaymentMethodId } from '../types/cart';

interface PaymentMethodsProps {
  methods: PaymentMethod[];
  value: PaymentMethodId;
  onChange: (id: PaymentMethodId) => void;
  /** COD is not allowed for auction wins (FR-21). */
  hasAuctionItems: boolean;
}

export default function PaymentMethods({
  methods,
  value,
  onChange,
  hasAuctionItems,
}: PaymentMethodsProps) {
  return (
    <div className="nx-cart-pay-list">
      {methods.map((method) => {
        const isDisabled = method.id === 'cod' && hasAuctionItems;
        const isActive = method.id === value;

        return (
          <label
            key={method.id}
            className={`nx-cart-pay${isActive ? ' nx-cart-pay--active' : ''}${
              isDisabled ? ' nx-cart-pay--disabled' : ''
            }`}
          >
            <input
              type="radio"
              name="payment-method"
              className="nx-cart-pay-radio"
              value={method.id}
              checked={isActive}
              disabled={isDisabled}
              onChange={() => onChange(method.id)}
            />

            <span
              className={`nx-cart-pay-tile${method.accent ? ' nx-cart-pay-tile--accent' : ''}`}
              aria-hidden="true"
            >
              {method.monogram ? (
                method.monogram
              ) : (
                <i className={method.icon}></i>
              )}
            </span>

            <div className="nx-cart-pay-body">
              <div className="nx-cart-pay-name-row">
                <span className="nx-cart-pay-name">{method.name}</span>
                {method.badge && (
                  <span className="nx-cart-pay-badge">{method.badge}</span>
                )}
              </div>
              <p className="nx-cart-pay-desc">{method.description}</p>
            </div>

            <div className="nx-cart-pay-trailing">
              {method.brands && (
                <div className="nx-cart-pay-brands">
                  {method.brands.map((brand) => (
                    <span
                      key={brand}
                      className={`nx-cart-pay-brand${
                        brand === 'MC' ? ' nx-cart-pay-brand--accent' : ''
                      }`}
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              )}
              {method.trailingIcon && (
                <i
                  className={`bi ${method.trailingIcon} nx-cart-pay-trailing-icon`}
                  aria-hidden="true"
                ></i>
              )}
              {method.tag && (
                <span className="nx-cart-pay-tag">{method.tag}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
