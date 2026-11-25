import type { ShippingMethod, ShippingMethodId } from '../types/cart';
import { formatVnd } from '../utils/cart.format';

interface ShippingOptionsProps {
  methods: ShippingMethod[];
  value: ShippingMethodId;
  onChange: (id: ShippingMethodId) => void;
}

export default function ShippingOptions({
  methods,
  value,
  onChange,
}: ShippingOptionsProps) {
  return (
    <div className="nx-cart-shipping">
      <h4 className="nx-cart-shipping-title">Chọn gói vận chuyển:</h4>

      <div className="nx-cart-shipping-list">
        {methods.map((method) => {
          const isActive = method.id === value;

          return (
            <label
              key={method.id}
              className={`nx-cart-option${isActive ? ' nx-cart-option--active' : ''}`}
            >
              <input
                type="radio"
                name="shipping-method"
                className="nx-cart-option-radio"
                value={method.id}
                checked={isActive}
                onChange={() => onChange(method.id)}
              />

              <div className="nx-cart-option-body">
                <div className="nx-cart-option-row">
                  <span className="nx-cart-option-name">{method.name}</span>
                  <span
                    className={`nx-cart-option-fee${method.freeLabel ? ' nx-cart-option-fee--free' : ''}`}
                  >
                    {method.freeLabel ? 'Miễn phí' : formatVnd(method.fee)}
                  </span>
                </div>

                <p className="nx-cart-option-eta">{method.eta}</p>

                {method.highlight ? (
                  <span className="nx-cart-option-highlight">
                    {method.highlight}
                  </span>
                ) : (
                  <span className="nx-cart-option-carrier">
                    {method.carrier}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
