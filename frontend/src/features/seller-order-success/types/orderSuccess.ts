import type { OrderSuccessState } from '../hooks/useOrderSuccess';
export type LoadedOrderSuccessState = OrderSuccessState & { order: NonNullable<OrderSuccessState['order']> };
