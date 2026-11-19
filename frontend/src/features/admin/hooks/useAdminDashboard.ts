import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DetailedAdminOrder } from '../types/commerce.types';
import { adminUsersApi, adminCommerceApi, adminAuctionApi } from '../services/admin.service';

interface DashboardStats {
  totalUsers: number | null;
  totalOrders: number | null;
  activeAuctions: number | null;
}

const emptyStats: DashboardStats = { totalUsers: null, totalOrders: null, activeAuctions: null };

export function useAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [recentOrders, setRecentOrders] = useState<DetailedAdminOrder[]>([]);
  const [ordersError, setOrdersError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const fetchDashboardData = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true);
    setError(null);
    const [users, orders, auctions] = await Promise.allSettled([
      adminUsersApi.list({ size: 1 }),
      adminCommerceApi.listOrders({ size: 5, sort: 'createdAt,desc' }),
      adminAuctionApi.list({ status: 'ACTIVE', size: 1 }),
    ]);
    if (request !== requestId.current) return;

    setStats({
      totalUsers: users.status === 'fulfilled' ? users.value.totalElements : null,
      totalOrders: orders.status === 'fulfilled' ? orders.value.totalElements : null,
      activeAuctions: auctions.status === 'fulfilled' ? auctions.value.totalElements : null,
    });
    setRecentOrders(orders.status === 'fulfilled' ? orders.value.content : []);
    setOrdersError(orders.status === 'rejected');
    const unavailable = [
      users.status === 'rejected' && 'người dùng',
      orders.status === 'rejected' && 'đơn hàng',
      auctions.status === 'rejected' && 'đấu giá',
    ].filter(Boolean);
    setError(unavailable.length ? `Chưa tải được dữ liệu ${unavailable.join(', ')}. Bạn có thể thử làm mới.` : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchDashboardData();
    return () => { requestId.current += 1; };
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return { navigate, stats, recentOrders, ordersError, error, loading, fetchDashboardData, formatCurrency };
}
