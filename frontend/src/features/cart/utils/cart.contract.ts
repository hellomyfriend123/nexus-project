import type { CommerceCart } from '../../../services/api/commerce';

/** Compare server totals and item identities, not only optimistic quantities. */
export function hasCartFinancialDrift(previous: CommerceCart | null, latest: CommerceCart): boolean {
  if (!previous || previous.id !== latest.id || Number(previous.subtotal) !== Number(latest.subtotal) || previous.items.length !== latest.items.length) return true;
  const old = new Map(previous.items.map(line => [line.id, line]));
  return latest.items.some(line => {
    const before = old.get(line.id);
    return !before || before.productId !== line.productId || before.sellerId !== line.sellerId || before.skuId !== line.skuId
      || before.quantity !== line.quantity || Number(before.unitPrice) !== Number(line.unitPrice) || Number(before.lineTotal) !== Number(line.lineTotal);
  });
}

/** CheckoutRequest contract. No changes to checkout UI or payment support. */
export function validateCheckoutAddress(input: { receiverName: string; receiverPhone: string; shippingAddress: string }): string | null {
  if (!input.receiverName.trim() || input.receiverName.length > 150) return 'Tên người nhận bắt buộc, tối đa 150 ký tự.';
  if (!/^[0-9+][0-9\-\s]{7,19}$/.test(input.receiverPhone)) return 'Số điện thoại người nhận không hợp lệ (8–20 ký tự, chữ số, +, dấu - hoặc khoảng trắng).';
  if (!input.shippingAddress.trim() || input.shippingAddress.length > 500) return 'Địa chỉ nhận hàng bắt buộc, tối đa 500 ký tự.';
  return null;
}

/** CheckoutServiceImpl.resolveSingleSellerId supports exactly one seller per checkout. */
export function validateCheckoutCart(cart: CommerceCart): string | null {
  if (!cart.items.length) return 'Giỏ hàng đang trống.';
  if (new Set(cart.items.map(item => item.sellerId)).size > 1) return 'Máy chủ chỉ hỗ trợ một người bán trong mỗi lần đặt hàng. Vui lòng tách giỏ hàng trước khi tiếp tục.';
  return null;
}
