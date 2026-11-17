const steps = ['Xem lại giỏ', 'Giao hàng', 'Thanh toán'];

interface CartStepperProps {
  /** 1-based index of the current step. */
  current?: number;
}

export default function CartStepper({ current = 1 }: CartStepperProps) {
  return (
    <ol className="nx-cart-stepper" aria-label="Tiến trình thanh toán">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const state =
          stepNumber === current
            ? 'is-active'
            : stepNumber < current
              ? 'is-done'
              : '';

        return (
          <li className="nx-cart-step-item" key={step}>
            <span
              className={`nx-cart-step ${state}`.trim()}
              aria-current={stepNumber === current ? 'step' : undefined}
            >
              <span className="nx-cart-step-num" aria-hidden="true">
                {stepNumber}
              </span>
              <span>{step}</span>
            </span>
            {stepNumber < steps.length && (
              <span className="nx-cart-step-line" aria-hidden="true"></span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
