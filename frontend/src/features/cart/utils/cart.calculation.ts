import type { CartItem, CartTotals, Voucher } from '../types/cart';

export interface CalculateTotalsInput {
  shippingFee: number;
  voucher?: Voucher | null;
}

/**
 * Cart totals (FR-17). Vouchers only discount direct-purchase items and are
 * capped by that subtotal, so a voucher can never create a negative line.
 */
export function calculateTotals(
  items: CartItem[],
  { shippingFee, voucher }: CalculateTotalsInput,
): CartTotals {
  const directItems = items.filter((item) => item.mode === 'direct');
  const auctionItems = items.filter((item) => item.mode === 'auction');
  const directSubtotal = directItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const auctionSubtotal = auctionItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const directCount = directItems.reduce((sum, item) => sum + item.quantity, 0);
  const auctionCount = auctionItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const discount = voucher ? Math.min(voucher.discount, directSubtotal) : 0;
  const shipping = items.length > 0 ? shippingFee : 0;

  return {
    directSubtotal,
    directCount,
    auctionSubtotal,
    auctionCount,
    shippingFee: shipping,
    discount,
    total: directSubtotal + auctionSubtotal + shipping - discount,
  };
}
