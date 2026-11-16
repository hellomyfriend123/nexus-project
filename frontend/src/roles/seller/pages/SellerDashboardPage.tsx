import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerStatCard from '../components/SellerStatCard';
import { getSession } from '../../../features/auth/services/auth.api';
import {
  sellerCatalogApi,
  sellerCommerceApi,
  sellerFulfillmentApi,
  sellerAuctionApi,
} from '../sellerApi';
import type { SellerOrderSummary, AuctionResponse } from '../sellerApi';

export function SellerDashboardPage() {
  const navigate = useNavigate();
  const session = getSession();

  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [activeAuctionsCount, setActiveAuctionsCount] = useState(0);

  const [recentOrders, setRecentOrders] = useState<SellerOrderSummary[]>([]);
  const [activeAuctions, setActiveAuctions] = useState<AuctionResponse[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [prodRes, orderRes, invRes, aucRes] = await Promise.all([
          sellerCatalogApi.listProducts().catch(() => ({ content: [], totalElements: 0 })),
          sellerCommerceApi.listOrders().catch(() => ({ content: [], totalElements: 0 })),
          sellerFulfillmentApi.listInventories().catch(() => ({ content: [], totalElements: 0 })),
          sellerAuctionApi.listAuctions().catch(() => ({ content: [], totalElements: 0 })),
        ]);

        setTotalProducts(prodRes?.totalElements ?? prodRes?.content?.length ?? 0);

        const orders = orderRes?.content || [];
        setRecentOrders(orders.slice(0, 5));
        setNewOrdersCount(orders.filter((o) => o.status === 'PENDING').length);

        const inventories = invRes?.content || [];
        setLowStockCount(inventories.filter((i) => i.status === 'LOW_STOCK' || i.availableQuantity <= 5).length);

        const auctions = aucRes?.content || [];
        setActiveAuctions(auctions.slice(0, 4));
        setActiveAuctionsCount(auctions.filter((a) => a.status === 'ACTIVE' || a.status === 'SCHEDULED').length);
      } catch (err) {
        console.error('Lỗi tải dữ liệu dashboard seller:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      {/* Banner */}
      <div
        className="nx-seller-card d-flex flex-wrap align-items-center justify-content-between p-4 mb-4"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #315bf4 100%)', color: '#ffffff' }}
      >
        <div>
          <span className="badge bg-white text-primary mb-2 fw-semibold px-2 py-1">Kênh Người Bán Nexus</span>
          <h2 className="fw-bold m-0 text-white">Xin chào, {session?.fullName || 'Gian hàng Seller'}!</h2>
          <p className="m-0 mt-1 opacity-75" style={{ fontSize: '13px' }}>
            Dữ liệu thống kê thời gian thực từ 20 API Backend Nexus.
          </p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button
            type="button"
            className="btn btn-light text-primary fw-semibold d-flex align-items-center gap-2"
            onClick={() => navigate('/seller/products')}
          >
            <i className="bi bi-plus-circle-fill"></i>
            <span>Đăng sản phẩm mới (FR-05)</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-light fw-semibold d-flex align-items-center gap-2"
            onClick={() => navigate('/seller/auctions')}
          >
            <i className="bi bi-hammer"></i>
            <span>Tạo đấu giá (FR-26)</span>
          </button>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="nx-seller-stat-grid">
        <SellerStatCard
          title="Sản phẩm trên sàn"
          value={loading ? '...' : totalProducts}
          icon="bi-box-seam"
          color="primary"
          subtitle="Catalog API FR-05/FR-06"
          badge={`${totalProducts} SP`}
        />
        <SellerStatCard
          title="Đơn chờ duyệt"
          value={loading ? '...' : newOrdersCount}
          icon="bi-receipt"
          color="warning"
          subtitle="Commerce API FR-23/FR-24"
          badge="Cần xử lý"
        />
        <SellerStatCard
          title="Tồn kho thấp"
          value={loading ? '...' : lowStockCount}
          icon="bi-exclamation-triangle"
          color="danger"
          subtitle="Fulfillment API FR-13/FR-14"
          badge="Cảnh báo kho"
        />
        <SellerStatCard
          title="Phiên đấu giá"
          value={loading ? '...' : activeAuctionsCount}
          icon="bi-hammer"
          color="success"
          subtitle="Auction API FR-26/FR-29"
          badge="Đang chạy"
        />
      </div>

      <div className="row g-4">
        {/* Recent Orders */}
        <div className="col-12 col-lg-7">
          <div className="nx-seller-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold m-0 d-flex align-items-center gap-2">
                <i className="bi bi-truck text-primary"></i>
                <span>Đơn hàng mới nhận từ khách (FR-23)</span>
              </h5>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none"
                onClick={() => navigate('/seller/orders')}
              >
                Xem tất cả đơn <i className="bi bi-arrow-right"></i>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                <small className="text-muted ms-2">Đang tải đơn hàng...</small>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-inbox fs-3 d-block mb-1"></i>
                <small>Chưa có đơn hàng nào phát sinh</small>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="nx-seller-table">
                  <thead>
                    <tr>
                      <th>Mã đơn hàng</th>
                      <th>Tổng tiền</th>
                      <th>Ngày đặt</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td className="fw-bold font-monospace text-primary">{ord.orderNumber}</td>
                        <td className="fw-semibold">{Number(ord.totalAmount).toLocaleString('vi-VN')} ₫</td>
                        <td className="text-muted small">
                          {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td>
                          <span
                            className={`nx-badge ${ord.status === 'PENDING' ? 'nx-badge-warning' : ord.status === 'CONFIRMED' ? 'nx-badge-info' : ord.status === 'SHIPPING' ? 'nx-badge-primary' : ord.status === 'COMPLETED' ? 'nx-badge-success' : 'nx-badge-danger'}`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-primary py-1 px-2"
                            style={{ fontSize: '11px' }}
                            onClick={() => navigate('/seller/orders')}
                          >
                            Xử lý đơn
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Active Auctions Preview */}
        <div className="col-12 col-lg-5">
          <div className="nx-seller-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold m-0 d-flex align-items-center gap-2">
                <i className="bi bi-hammer text-warning"></i>
                <span>Đấu giá trực tuyến (FR-28, FR-29)</span>
              </h5>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none"
                onClick={() => navigate('/seller/auctions')}
              >
                Tất cả <i className="bi bi-arrow-right"></i>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
                <small className="text-muted ms-2">Đang tải phiên đấu giá...</small>
              </div>
            ) : activeAuctions.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-hammer fs-3 d-block mb-1"></i>
                <small>Chưa có phiên đấu giá nào đang diễn ra</small>
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-warning"
                    onClick={() => navigate('/seller/auctions')}
                  >
                    + Tạo phiên đầu tiên
                  </button>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {activeAuctions.map((auc) => (
                  <div key={auc.id} className="p-3 border rounded-3 bg-light-subtle">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="fw-bold text-truncate" style={{ maxWidth: '200px', fontSize: '13px' }}>
                        Mã phiên: {auc.id.slice(0, 8)}...
                      </span>
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle" style={{ fontSize: '11px' }}>
                        {auc.status}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>Giá khởi điểm</small>
                        <span className="fw-bold text-success">{Number(auc.startingPrice).toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-1 px-2"
                        style={{ fontSize: '11px' }}
                        onClick={() => navigate('/seller/auctions')}
                      >
                        Quản lý
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboardPage;
