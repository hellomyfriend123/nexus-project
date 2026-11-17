import { formatCountdown, formatVnd } from '../../cart/utils/cart.format';

/**
 * Buyer Hub formatting helpers.
 * `formatVnd` / `formatCountdown` are re-used from the cart feature so prices and
 * countdowns stay identical across the buyer flow. TODO: hoist both into
 * `shared/utils` when a shared formatting layer is approved.
 */
export { formatCountdown, formatVnd };

/** 37600000 -> "37.8M", 18500000 -> "18.5M" (labels fixed by the design). */
export function formatCompactMillions(amount: number): string {
  const millions = amount / 1000000;
  const rounded = Math.round(millions * 10) / 10;
  return `${rounded.toLocaleString('vi-VN')}M`;
}

/** Countdown shown in the "Thắng chờ thanh toán" KPI and the win banner. */
export function formatWinCountdown(totalSeconds: number): string {
  return `Còn ${formatCountdown(totalSeconds)}`;
}

/** Only two decimals are meaningful on a 4.9/5 rating label. */
export function formatReviewCount(count: number): string {
  return `(${count} đánh giá tín nhiệm)`;
}

/** Splits a "1.000.000" style numeric input into a plain number, mock-only. */
export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}
