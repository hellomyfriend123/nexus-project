import './QuantityStepper.css';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  onChange: (next: number) => void;
}

export default function QuantityStepper({
  value,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  label,
  onChange,
}: QuantityStepperProps) {
  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () => onChange(Math.min(max, value + 1));

  return (
    <div className="nx-quantity-stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="nx-quantity-stepper-button"
        onClick={decrease}
        disabled={value <= min}
        aria-label={`Giảm số lượng ${label}`}
      >
        <i className="bi bi-dash" aria-hidden="true"></i>
      </button>
      <input
        className="nx-quantity-stepper-value"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={`Số lượng ${label}`}
        onFocus={event => event.currentTarget.select()}
        onChange={event => {
          const next = event.currentTarget.valueAsNumber;
          if (Number.isFinite(next)) {
            onChange(Math.max(min, Math.min(max, Math.trunc(next))));
          }
        }}
        onBlur={event => {
          if (!event.currentTarget.value) event.currentTarget.value = String(value);
        }}
      />
      <button
        type="button"
        className="nx-quantity-stepper-button"
        onClick={increase}
        disabled={value >= max}
        aria-label={`Tăng số lượng ${label}`}
      >
        <i className="bi bi-plus" aria-hidden="true"></i>
      </button>
    </div>
  );
}
