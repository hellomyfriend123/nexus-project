import type { DetailedAdminOrder } from '../types/commerce.types';
import { dashboardPresentationMock } from '../services/dashboard.mock';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  adminUsersApi,
  adminCommerceApi,
  adminAuctionApi,
} from '../services/admin.service';
import type { AdminReview } from '../types/admin.types';


export function useAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: dashboardPresentationMock.totalRevenue,
    pendingReviews: 0,
    activeAuctions: 0,
  });
  const [recentOrders, setRecentOrders] = useState<DetailedAdminOrder[]>([]);
  const [pendingReviews, setPendingReviews] = useState<AdminReview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUsingRealApi, setIsUsingRealApi] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Run parallel requests to backend controllers
      const [usersRes, ordersRes, auctionsRes] = await Promise.allSettled([
        adminUsersApi.list({ size: 1 }),
        adminCommerceApi.listOrders({ size: 5 }),
        adminAuctionApi.list({ status: 'ACTIVE', size: 1 }),
      ]);

      const failures = [usersRes, ordersRes, auctionsRes].filter(result => result.status === 'rejected');
      if (failures.length) setError(failures.map(result => result.status === 'rejected' ? String(result.reason instanceof Error ? result.reason.message : result.reason) : '').join('; '));
      let anySuccess = false;

      // Parse Orders
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.content) {
        setRecentOrders(ordersRes.value.content);

        setStats((prev) => ({
          ...prev,
          totalOrders: ordersRes.value.totalElements ?? ordersRes.value.content.length,
        }));
        anySuccess = true;
      }

      // Parse Users
      if (usersRes.status === 'fulfilled' && usersRes.value?.totalElements !== undefined) {
        setStats((prev) => ({
          ...prev,
          totalUsers: usersRes.value.totalElements,
        }));
        anySuccess = true;
      }

      // No PENDING state or pending-review endpoint exists in this backend.
      setPendingReviews([]);
      setStats(prev => ({ ...prev, pendingReviews: 0 }));

      // Parse Auctions
      if (auctionsRes.status === 'fulfilled' && auctionsRes.value?.totalElements !== undefined) {
        setStats((prev) => ({
          ...prev,
          activeAuctions: auctionsRes.value.totalElements,
        }));
        anySuccess = true;
      }

      setIsUsingRealApi(anySuccess);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Không thể tải dữ liệu.');
      setIsUsingRealApi(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
      amount,
    );
  };

  // This unavailable queue is deliberately read-only; never mutate VISIBLE rows as pending.
  const handleApproveReview = async (_id: string) => { setError('Pending-review moderation is unavailable: backend only supports VISIBLE/HIDDEN reviews.'); };
  const handleRejectReview = handleApproveReview;

  return { navigate, stats, setStats, recentOrders, setRecentOrders, pendingReviews, setPendingReviews, error, setError, loading, setLoading, isUsingRealApi, setIsUsingRealApi, fetchDashboardData, formatCurrency, handleApproveReview, handleRejectReview };
}
