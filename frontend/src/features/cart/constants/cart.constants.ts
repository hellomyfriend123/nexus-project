import type { PaymentMethod, ShippingMethod } from '../types/cart';

// Only COD is supported. Delivery pricing is confirmed by the server.
export const paymentMethods: PaymentMethod[] = [{ id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', description: 'Thanh toán khi nhận hàng', icon: 'bi-cash-coin' }];
export const shippingMethods: ShippingMethod[] = [];
