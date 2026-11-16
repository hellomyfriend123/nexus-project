import { useState, useEffect } from 'react';
import SellerModal from '../components/SellerModal';
import { sellerAuctionApi, sellerCatalogApi } from '../sellerApi';
import type { AuctionResponse, ProductSummaryResponse } from '../sellerApi';

export function SellerAuctionsPage() {
  const [auctions, setAuctions] = useState<AuctionResponse[]>([]);
  const [products, setProducts] = useState<ProductSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedAuction, setSelectedAuction] = useState<AuctionResponse | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    productId: '',
    startingPrice: 500000,
    startTime: '',
    endTime: '',
  });

  const [editForm, setEditForm] = useState({
    startingPrice: 500000,
    startTime: '',
    endTime: '',
  });

  const loadAuctionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aucRes, prodRes] = await Promise.all([
        sellerAuctionApi.listAuctions().catch(() => ({ content: [] })),
        sellerCatalogApi.listProducts().catch(() => ({ content: [] })),
      ]);
      setAuctions(aucRes?.content || []);
      setProducts(prodRes?.content || []);
      if (prodRes?.content?.length && !createForm.productId) {
        setCreateForm((prev) => ({ ...prev, productId: prodRes.content[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách phiên đấu giá từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuctionData();
  }, []);

  // API 1: POST /api/v1/seller/auction/auctions (FR-26)
  const handleCreate = async () => {
    if (!createForm.productId || !createForm.startTime || !createForm.endTime) {
      alert('Vui lòng chọn sản phẩm và nhập thời gian bắt đầu, kết thúc.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sellerAuctionApi.createAuction({
        productId: createForm.productId,
        startingPrice: Number(createForm.startingPrice),
        startTime: new Date(createForm.startTime).toISOString(),
        endTime: new Date(createForm.endTime).toISOString(),
      });
      setSuccessMsg('Tạo phiên đấu giá thành công qua API POST /api/v1/seller/auction/auctions!');
      setCreateModalOpen(false);
      loadAuctionData();
    } catch (err: any) {
      alert(err.message || 'Tạo phiên đấu giá thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // API 2: PUT /api/v1/seller/auction/auctions/{id} (FR-27)
  const handleEdit = async () => {
    if (!selectedAuction || !editForm.startTime || !editForm.endTime) {
      alert('Vui lòng điền đủ thông tin thời gian bắt đầu và kết thúc.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sellerAuctionApi.updateAuction(selectedAuction.id, {
        startingPrice: Number(editForm.startingPrice),
        startTime: new Date(editForm.startTime).toISOString(),
        endTime: new Date(editForm.endTime).toISOString(),
      });
      setSuccessMsg(`Cập nhật phiên đấu giá ${selectedAuction.id} thành công qua API PUT!`);
      setEditModalOpen(false);
      loadAuctionData();
    } catch (err: any) {
      alert(err.message || 'Cập nhật phiên thất bại (phiên có thể đã bắt đầu hoặc kết thúc).');
    } finally {
      setIsSubmitting(false);
    }
  };

  // API 3: POST /api/v1/seller/auction/auctions/{id}/cancel (FR-37)
  const handleCancel = async () => {
    if (!selectedAuction) return;
    setIsSubmitting(true);
    try {
      await sellerAuctionApi.cancelAuction(selectedAuction.id);
      setSuccessMsg(`Hủy phiên đấu giá ${selectedAuction.id} thành công qua API POST!`);
      setCancelModalOpen(false);
      loadAuctionData();
    } catch (err: any) {
      alert(err.message || 'Hủy phiên thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="nx-seller-page-header">
        <div>
          <h2 className="nx-seller-page-title">Quản lý Phiên Đấu Giá</h2>
          <p className="nx-seller-page-desc">
            Kết nối 3 API Auction Seller thật: Khởi tạo (FR-26), Cấu hình lại (FR-27), Hủy phiên (FR-37)
          </p>
        </div>

        {/* API 1: POST /api/v1/seller/auction/auctions */}
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
          onClick={() => setCreateModalOpen(true)}
        >
          <span className="nx-api-badge post">POST</span>
          <i className="bi bi-hammer"></i>
          <span>Tạo phiên đấu giá thật (FR-26)</span>
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

      {/* Table */}
      <div className="nx-seller-card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2 mb-0">Đang tải phiên đấu giá từ máy chủ...</p>
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-hammer fs-1 text-muted"></i>
            <h5 className="mt-3 fw-bold">Chưa có phiên đấu giá nào</h5>
            <p className="text-muted small">Hãy bấm nút "Tạo phiên đấu giá thật" ở trên để đưa sản phẩm của bạn lên sàn đấu giá!</p>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              + Tạo phiên đấu giá ngay
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="nx-seller-table">
              <thead>
                <tr>
                  <th>Mã phiên</th>
                  <th>Mã Product</th>
                  <th>Giá khởi điểm</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời gian kết thúc</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Hành động Backend API</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((auc) => (
                  <tr key={auc.id}>
                    <td className="font-monospace fw-bold text-dark">{auc.id.slice(0, 8)}...</td>
                    <td className="font-monospace text-primary">{auc.productId.slice(0, 8)}...</td>
                    <td className="fw-bold">{Number(auc.startingPrice).toLocaleString('vi-VN')} ₫</td>
                    <td className="text-muted small">
                      {auc.startTime ? new Date(auc.startTime).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="text-muted small">
                      {auc.endTime ? new Date(auc.endTime).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td>
                      <span className={`nx-badge ${auc.status === 'ACTIVE' ? 'nx-badge-success' : auc.status === 'SCHEDULED' ? 'nx-badge-warning' : 'nx-badge-secondary'}`}>
                        {auc.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {/* API 2: PUT /api/v1/seller/auction/auctions/{id} */}
                        <button
                          type="button"
                          className="btn btn-outline-warning d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            setSelectedAuction(auc);
                            setEditForm({
                              startingPrice: auc.startingPrice,
                              startTime: auc.startTime ? auc.startTime.slice(0, 16) : '',
                              endTime: auc.endTime ? auc.endTime.slice(0, 16) : '',
                            });
                            setEditModalOpen(true);
                          }}
                          title="Cấu hình lại phiên đấu giá (FR-27)"
                        >
                          <span className="nx-api-badge put" style={{ fontSize: '9px' }}>PUT</span>
                          <span>Cấu hình</span>
                        </button>

                        {/* API 3: POST /api/v1/seller/auction/auctions/{id}/cancel */}
                        {auc.status !== 'CANCELLED' && auc.status !== 'ENDED' && (
                          <button
                            type="button"
                            className="btn btn-outline-danger d-inline-flex align-items-center gap-1"
                            onClick={() => {
                              setSelectedAuction(auc);
                              setCancelModalOpen(true);
                            }}
                            title="Hủy phiên đấu giá (FR-37)"
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

      {/* Modal 1: Create Auction (POST /api/v1/seller/auction/auctions) */}
      <SellerModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tạo phiên đấu giá thật (POST /api/v1/seller/auction/auctions)"
        apiBadge={{ method: 'POST', endpoint: '/api/v1/seller/auction/auctions' }}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        submitText="Gửi API Tạo Phiên (POST)"
      >
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label fw-semibold">Chọn sản phẩm đấu giá (*)</label>
            <select
              className="form-select"
              value={createForm.productId}
              onChange={(e) => setCreateForm({ ...createForm, productId: e.target.value })}
              required
            >
              <option value="">-- Chọn sản phẩm của bạn --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id.slice(0, 8)}...)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label fw-semibold">Giá khởi điểm (VND) (*)</label>
            <input
              type="number"
              className="form-control"
              value={createForm.startingPrice}
              onChange={(e) => setCreateForm({ ...createForm, startingPrice: Number(e.target.value) })}
              min={1000}
              required
            />
          </div>
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label fw-semibold">Thời điểm bắt đầu (*)</label>
              <input
                type="datetime-local"
                className="form-control"
                value={createForm.startTime}
                onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                required
              />
            </div>
            <div className="col-6">
              <label className="form-label fw-semibold">Thời điểm kết thúc (*)</label>
              <input
                type="datetime-local"
                className="form-control"
                value={createForm.endTime}
                onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
      </SellerModal>

      {/* Modal 2: Edit Auction (PUT /api/v1/seller/auction/auctions/{id}) */}
      <SellerModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Cấu hình phiên đấu giá: ${selectedAuction?.id?.slice(0, 8)} (FR-27)`}
        apiBadge={{ method: 'PUT', endpoint: `/api/v1/seller/auction/auctions/${selectedAuction?.id || '{id}'}` }}
        onSubmit={handleEdit}
        isSubmitting={isSubmitting}
        submitText="Gửi API Cập Nhật (PUT)"
      >
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label fw-semibold">Giá khởi điểm điều chỉnh (*)</label>
            <input
              type="number"
              className="form-control"
              value={editForm.startingPrice}
              onChange={(e) => setEditForm({ ...editForm, startingPrice: Number(e.target.value) })}
              min={1000}
              required
            />
          </div>
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label fw-semibold">Thời điểm bắt đầu (*)</label>
              <input
                type="datetime-local"
                className="form-control"
                value={editForm.startTime}
                onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                required
              />
            </div>
            <div className="col-6">
              <label className="form-label fw-semibold">Thời điểm kết thúc (*)</label>
              <input
                type="datetime-local"
                className="form-control"
                value={editForm.endTime}
                onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
      </SellerModal>

      {/* Modal 3: Cancel Auction (POST /api/v1/seller/auction/auctions/{id}/cancel) */}
      <SellerModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Xác nhận hủy phiên đấu giá (FR-37)"
        apiBadge={{ method: 'POST', endpoint: `/api/v1/seller/auction/auctions/${selectedAuction?.id || '{id}'}/cancel` }}
        onSubmit={handleCancel}
        isSubmitting={isSubmitting}
        submitText="Xác nhận hủy thật (POST)"
      >
        <div className="alert alert-danger mb-0">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Bạn có chắc chắn muốn hủy phiên đấu giá <strong>{selectedAuction?.id}</strong>? Yêu cầu sẽ gửi trực tiếp lên Backend qua API POST /cancel.
        </div>
      </SellerModal>
    </div>
  );
}

export default SellerAuctionsPage;
