import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminStatCard from '../components/AdminStatCard';
import {
  adminUsersApi,
  adminCommerceApi,
  adminCatalogApi,
  adminAuctionApi,
} from '../../../services/api/adminApi';
import type { AdminOrder, AdminReview } from '../../../features/admin/types/admin.types';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingReviews: 0,
    activeAuctions: 0,
  });
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [pendingReviews, setPendingReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUsingRealApi, setIsUsingRealApi] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Run parallel requests to backend controllers
      const [usersRes, ordersRes, reviewsRes, auctionsRes] = await Promise.allSettled([
        adminUsersApi.list({ size: 1 }),
        adminCommerceApi.listOrders({ size: 5 }),
        adminCatalogApi.listReviews({ status: 'PENDING', size: 10 }),
        adminAuctionApi.list({ status: 'ACTIVE', size: 1 }),
      ]);

      let anySuccess = false;

      // Parse Orders
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.content) {
        setRecentOrders(ordersRes.value.content);
        const totalRevenueCalc = ordersRes.value.content.reduce(
          (sum: number, o: AdminOrder) => sum + (o.totalAmount || 0),
          0,
        );
        setStats((prev) => ({
          ...prev,
          totalOrders: ordersRes.value.totalElements ?? ordersRes.value.content.length,
          totalRevenue: totalRevenueCalc > 0 ? totalRevenueCalc : prev.totalRevenue,
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

      // Parse Reviews
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value?.content) {
        setPendingReviews(reviewsRes.value.content);
        setStats((prev) => ({
          ...prev,
          pendingReviews: reviewsRes.value.totalElements ?? reviewsRes.value.content.length,
        }));
        anySuccess = true;
      }

      // Parse Auctions
      if (auctionsRes.status === 'fulfilled' && auctionsRes.value?.totalElements !== undefined) {
        setStats((prev) => ({
          ...prev,
          activeAuctions: auctionsRes.value.totalElements,
        }));
        anySuccess = true;
      }

      setIsUsingRealApi(anySuccess);
    } catch {
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

  const handleApproveReview = async (id: string) => {
    try {
      await adminCatalogApi.updateReviewStatus(id, 'APPROVED');
      setPendingReviews((prev) => prev.filter((r) => r.id !== id));
      alert(`Đã phê duyệt đánh giá #${id} qua REST API`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể phê duyệt đánh giá:\n${errorMsg}`);
    }
  };

  const handleRejectReview = async (id: string) => {
    try {
      await adminCatalogApi.updateReviewStatus(id, 'REJECTED');
      setPendingReviews((prev) => prev.filter((r) => r.id !== id));
      alert(`Đã từ chối/ẩn đánh giá #${id} qua REST API`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể từ chối/ẩn đánh giá:\n${errorMsg}`);
    }
  };

  return (
    <div>
      <div className="nx-page-header">
        <div>
          <h1 className="nx-page-title">Tổng quan hệ thống</h1>
          <p className="nx-page-subtitle">
            Chào mừng trở lại! Dưới đây là tình hình hoạt động của sàn thương mại Nexus.
            <span
              style={{
                marginLeft: '8px',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: isUsingRealApi ? '#ecfdf5' : '#fef3c7',
                color: isUsingRealApi ? '#059669' : '#d97706',
                fontWeight: 600,
              }}
            >
              {isUsingRealApi ? '● Live REST API' : '○ Lỗi kết nối API'}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="nx-btn nx-btn-outline"
            onClick={() => fetchDashboardData()}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Làm mới
          </button>
          <button
            type="button"
            className="nx-btn nx-btn-outline"
            onClick={() => navigate('/admin/auctions')}
          >
            <i className="bi bi-hammer"></i> Xem đấu giá
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="nx-stat-grid">
        <AdminStatCard
          label="Tổng doanh thu"
          value={formatCurrency(stats.totalRevenue)}
          icon="bi-cash-coin"
          iconBg="#ecfdf5"
          iconColor="#059669"
          trend={{ value: '+14.2%', isPositive: true }}
        />
        <AdminStatCard
          label="Tổng người dùng"
          value={stats.totalUsers.toLocaleString()}
          icon="bi-people"
          iconBg="#eff6ff"
          iconColor="#315bf4"
          trend={{ value: '+8.5%', isPositive: true }}
        />
        <AdminStatCard
          label="Đơn hàng"
          value={stats.totalOrders}
          icon="bi-bag-check"
          iconBg="#fef3c7"
          iconColor="#d97706"
          trend={{ value: '+5.1%', isPositive: true }}
        />
        <AdminStatCard
          label="Phiên đấu giá đang diễn ra"
          value={stats.activeAuctions}
          icon="bi-fire"
          iconBg="#fef2f2"
          iconColor="#dc2626"
          subtitle="3 phiên sắp kết thúc hôm nay"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Recent Orders Table */}
        <div className="nx-admin-card">
          <div className="nx-admin-card-header">
            <h2 className="nx-admin-card-title">
              <i className="bi bi-receipt me-2 text-primary"></i> Đơn hàng gần đây
            </h2>
            <button
              type="button"
              className="nx-btn nx-btn-outline nx-btn-sm"
              onClick={() => navigate('/admin/commerce')}
            >
              Xem tất cả ({stats.totalOrders})
            </button>
          </div>
          <div className="nx-table-container">
            <table className="nx-admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#315bf4' }}>{ord.orderNumber}</span>
                    </td>
                    <td>
                      <div>{ord.buyerName || ((ord as any).buyerId ? `ID: ${(ord as any).buyerId.slice(0, 8)}...` : 'Khách mua')}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(ord.totalAmount)}</td>
                    <td>
                      <span
                        className={`nx-badge ${
                          ord.status === 'COMPLETED'
                            ? 'nx-badge-success'
                            : ord.status === 'SHIPPING'
                              ? 'nx-badge-primary'
                              : ord.status === 'CANCELLED'
                                ? 'nx-badge-danger'
                                : 'nx-badge-warning'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Reviews Moderation */}
        <div className="nx-admin-card">
          <div className="nx-admin-card-header">
            <h2 className="nx-admin-card-title">
              <i className="bi bi-shield-check me-2 text-warning"></i> Đánh giá chờ duyệt (FR-45)
            </h2>
            <button
              type="button"
              className="nx-btn nx-btn-outline nx-btn-sm"
              onClick={() => navigate('/admin/catalog')}
            >
              Quản lý đánh giá
            </button>
          </div>
          <div className="nx-admin-card-body" style={{ padding: '12px' }}>
            {pendingReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
                <i className="bi bi-check-circle" style={{ fontSize: '32px', color: '#10b981' }}></i>
                <p style={{ marginTop: '8px', fontSize: '13px' }}>Không có đánh giá nào chờ duyệt!</p>
              </div>
            ) : (
              pendingReviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{rev.productName}</span>
                    <span style={{ color: '#eab308', fontSize: '12px' }}>
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>
                    "{rev.comment}" — <em>{rev.userFullName}</em>
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="nx-btn nx-btn-primary nx-btn-sm"
                      onClick={() => handleApproveReview(rev.id)}
                    >
                      <i className="bi bi-check-lg"></i> Duyệt
                    </button>
                    <button
                      type="button"
                      className="nx-btn nx-btn-outline nx-btn-sm"
                      style={{ color: '#dc2626' }}
                      onClick={() => handleRejectReview(rev.id)}
                    >
                      <i className="bi bi-eye-slash"></i> Ẩn
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
