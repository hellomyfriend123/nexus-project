import type { Voucher } from '../types/cart';

export function findVoucher(code: string, vouchers: readonly Voucher[]): Voucher | undefined {
  const normalized = code.trim().toUpperCase();
  return vouchers.find((voucher) => voucher.code === normalized);
}

