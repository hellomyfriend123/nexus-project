import { useState, useEffect } from 'react';
import SellerModal from '../components/SellerModal';
import { sellerCommerceApi } from '../sellerApi';
import type { SellerOrderSummary, SellerOrderResponse } from '../sellerApi';

export function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<SellerOrderResponse | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<SellerOrderSummary | null>(null);

  const [newStatus, setNewStatus] = useState<'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED'>('CONFIRMED');

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sellerCommerceApi.listOrders({
        status: filterStatus === 'ALL' ? undefined : filterStatus,
      });
      setOrders(res?.content || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đơn hàng từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  // API 1: GET /api/v1/seller/commerce/orders/{id} (FR-23)
  const handleOpenDetail = async (order: SellerOrderSummary) => {
    setSelectedSummary(order);
    setIsSubmitting(true);
    try {
      const detail = await sellerCommerceApi.getOrder(order.id);
      setSelectedOrder(detail);
      setDetailModalOpen(true);
    } catch (err: any) {
      alert('Không thể tải chi tiết đơn hàng: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // API 2: PATCH /api/v1/seller/commerce/orders/{id}/status (FR-24)
  const handleUpdateStatus = async () => {
    if (!selectedSummary) return;
    setIsSubmitting(true);
    try {
      await sellerCommerceApi.updateOrderStatus(selectedSummary.id, newStatus);
      setSuccessMsg(`Cập nhật trạng thái đơn ${selectedSummary.orderNumber} thành công!`);
      setUpdateStatusModalOpen(false);
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái đơn thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // API 3: POST /api/v1/seller/commerce/orders/{id}/cancel (FR-25)
  const handleCancelOrder = async () => {
    if (!selectedSummary) return;
    setIsSubmitting(true);
    try {
      await sellerCommerceApi.cancelOrder(selectedSummary.id);
      setSuccessMsg(`Hủy đơn hàng ${selectedSummary.orderNumber} thành công qua API POST!`);
      setCancelModalOpen(false);
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Hủy đơn hàng thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="nx-seller-page-header">
        <div>
          <h2 className="nx-seller-page-title">Quản lý Đơn hàng Bán</h2>
          <p className="nx-seller-page-desc">
            Kết nối 4 API Commerce Seller thật: Xem danh sách (FR-23), Chi tiết đơn (FR-23), Cập nhật trạng thái (FR-24), Hủy đơn (FR-25)
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary d-flex align-items-center gap-1"
          onClick={loadOrders}
          disabled={loading}
        >
          <span className="nx-api-badge get">GET</span>
          <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-arrow-clockwise'}`}></i>
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-check-circle-fill"></i>
          <div>{successMsg}</div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="nx-seller-card p-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt (PENDING)</option>
              <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
              <option value="SHIPPING">Đang vận chuyển (SHIPPING)</option>
              <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="nx-seller-card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2 mb-0">Đang tải danh sách đơn hàng thật...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-receipt fs-1 text-muted"></i>
            <h5 className="mt-3 fw-bold">Chưa có đơn hàng nào</h5>
            <p className="text-muted small">Hiện tại gian hàng của bạn chưa nhận được đơn đặt hàng nào từ người mua.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="nx-seller-table">
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Tổng giá trị</th>
                  <th>Thời gian đặt</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác Backend API</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <div className="font-monospace fw-bold text-dark">{ord.orderNumber}</div>
                      <small className="text-muted font-monospace">{ord.id.slice(0, 8)}...</small>
                    </td>
                    <td className="fw-bold">{Number(ord.totalAmount).toLocaleString('vi-VN')} ₫</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td>
                      <span className={`nx-badge ${ord.status === 'PENDING' ? 'nx-badge-warning' : ord.status === 'CONFIRMED' ? 'nx-badge-info' : ord.status === 'SHIPPING' ? 'nx-badge-primary' : ord.status === 'COMPLETED' ? 'nx-badge-success' : 'nx-badge-danger'}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {/* API 1: GET /api/v1/seller/commerce/orders/{id} */}
                        <button
                          type="button"
                          className="btn btn-outline-info d-inline-flex align-items-center gap-1"
                          onClick={() => handleOpenDetail(ord)}
                          title="Xem chi tiết đơn hàng (FR-23)"
                        >
                          <span className="nx-api-badge get" style={{ fontSize: '9px' }}>GET</span>
                          <span>Chi tiết</span>
                        </button>

                        {/* API 2: PATCH /api/v1/seller/commerce/orders/{id}/status */}
                        <button
                          type="button"
                          className="btn btn-outline-primary d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            setSelectedSummary(ord);
                            setNewStatus('CONFIRMED');
                            setUpdateStatusModalOpen(true);
                          }}
                          title="Đổi trạng thái đơn (FR-24)"
                        >
                          <span className="nx-api-badge patch" style={{ fontSize: '9px' }}>PATCH</span>
                          <span>Đổi TT</span>
                        </button>

                        {/* API 3: POST /api/v1/seller/commerce/orders/{id}/cancel */}
                        {ord.status !== 'CANCELLED' && ord.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            className="btn btn-outline-danger d-inline-flex align-items-center gap-1"
                            onClick={() => {
                              setSelectedSummary(ord);
                              setCancelModalOpen(true);
                            }}
                            title="Hủy đơn hàng thật (FR-25)"
                          >
                            <span className="nx-api-badge post" style={{ fontSize: '9px' }}>POST</span>
                            <span>Hủy</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Details (GET /api/v1/seller/commerce/orders/{id}) */}
      <SellerModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Chi tiết đơn hàng: ${selectedOrder?.orderNumber} (FR-23)`}
        apiBadge={{ method: 'GET', endpoint: `/api/v1/seller/commerce/orders/${selectedOrder?.id || '{id}'}` }}
      >
        <div className="d-flex flex-column gap-3">
          <div className="p-3 bg-light rounded border">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Mã đơn hàng:</span>
              <span className="fw-bold font-monospace">{selectedOrder?.orderNumber}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Order ID:</span>
              <span className="font-monospace text-muted small">{selectedOrder?.id}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Địa chỉ nhận hàng:</span>
              <span className="text-end" style={{ maxWidth: '300px' }}>{selectedOrder?.shippingAddress || 'Theo đơn thanh toán'}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Trạng thái:</span>
              <span className="badge bg-primary">{selectedOrder?.status}</span>
            </div>
          </div>

          <h6 className="fw-bold m-0">Danh sách sản phẩm trong đơn</h6>
          <div className="table-responsive border rounded">
            <table className="table table-sm m-0">
              <thead className="table-light">
                <tr>
                  <th>Sản phẩm</th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th className="text-end">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>{Number(item.unitPrice).toLocaleString('vi-VN')} ₫</td>
                      <td className="text-end fw-bold">{Number(item.subtotal).toLocaleString('vi-VN')} ₫</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-2">
                      Chi tiết sản phẩm đã cập nhật
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
            <span className="fw-bold">Tổng thanh toán:</span>
            <span className="fs-5 fw-bold text-primary">{Number(selectedOrder?.totalAmount || 0).toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>
      </SellerModal>

      {/* Modal 2: Update Status (PATCH /api/v1/seller/commerce/orders/{id}/status) */}
      <SellerModal
        isOpen={updateStatusModalOpen}
        onClose={() => setUpdateStatusModalOpen(false)}
        title={`Cập nhật trạng thái đơn: ${selectedSummary?.orderNumber} (FR-24)`}
        apiBadge={{ method: 'PATCH', endpoint: `/api/v1/seller/commerce/orders/${selectedSummary?.id || '{id}'}/status` }}
        onSubmit={handleUpdateStatus}
        isSubmitting={isSubmitting}
        submitText="Gửi API Đổi Trạng Thái (PATCH)"
      >
        <div className="d-flex flex-column gap-3">
          <p className="text-muted mb-0">
            Cập nhật trạng thái xử lý đơn hàng cho <strong>{selectedSummary?.orderNumber}</strong>:
          </p>
          <div>
            <label className="form-label fw-semibold">Trạng thái mới (*)</label>
            <select
              className="form-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
            >
              <option value="CONFIRMED">Xác nhận đơn (CONFIRMED)</option>
              <option value="SHIPPING">Bàn giao shipper (SHIPPING)</option>
              <option value="COMPLETED">Hoàn tất giao dịch (COMPLETED)</option>
            </select>
          </div>
        </div>
      </SellerModal>

      {/* Modal 3: Cancel Order (POST /api/v1/seller/commerce/orders/{id}/cancel) */}
      <SellerModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`Hủy đơn hàng: ${selectedSummary?.orderNumber} (FR-25)`}
        apiBadge={{ method: 'POST', endpoint: `/api/v1/seller/commerce/orders/${selectedSummary?.id || '{id}'}/cancel` }}
        onSubmit={handleCancelOrder}
        isSubmitting={isSubmitting}
        submitText="Xác nhận hủy thật (POST)"
      >
        <div className="alert alert-danger mb-0">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Bạn có chắc chắn muốn hủy đơn hàng <strong>{selectedSummary?.orderNumber}</strong>? Yêu cầu sẽ gửi lên Backend qua API POST /cancel.
        </div>
      </SellerModal>
    </div>
  );
}

export default SellerOrdersPage;
