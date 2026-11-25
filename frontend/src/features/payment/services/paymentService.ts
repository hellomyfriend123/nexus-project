import { getSession } from '../../../services/api/auth';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export interface PaymentResponse {
  id: string;
  orderId: string;
  paymentMethod: string;
  paymentReference?: string;
  amount: number;
  status: string;
  idempotencyKey: string;
  paidAt?: string;
  createdAt?: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = getSession()?.accessToken;
  if (!token) {
    throw new Error('Bạn chưa đăng nhập hoặc phiên làm việc đã kết thúc.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function createOrderPayment(
  orderId: string,
  amount: number,
  paymentMethod: 'MOCK' | 'VNPAY' | 'COD' = 'MOCK'
): Promise<PaymentResponse> {
  const idempotencyKey =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `pay-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const res = await fetch(`${BASE_URL}/api/v1/buyer/commerce/orders/${orderId}/payments`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ paymentMethod, amount, idempotencyKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Không thể khởi tạo thanh toán (${res.status})`);
  }
  const data = await res.json();
  return data?.data ?? data;
}

export async function confirmPayment(
  paymentId: string,
  result: 'SUCCESS' | 'FAILED'
): Promise<PaymentResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/buyer/commerce/payments/${paymentId}/confirm`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ result }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Xác nhận thanh toán thất bại (${res.status})`);
  }
  const data = await res.json();
  return data?.data ?? data;
}
