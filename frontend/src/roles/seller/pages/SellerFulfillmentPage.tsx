import { useState, useEffect } from 'react';
import SellerModal from '../components/SellerModal';
import { sellerFulfillmentApi, sellerCatalogApi } from '../sellerApi';
import type { SkuResponse, InventoryResponse, ShipmentResponse, ProductSummaryResponse } from '../sellerApi';

export function SellerFulfillmentPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'skus' | 'shipments'>('inventory');

  const [inventories, setInventories] = useState<InventoryResponse[]>([]);
  const [skus, setSkus] = useState<SkuResponse[]>([]);
  const [products, setProducts] = useState<ProductSummaryResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [createSkuModalOpen, setCreateSkuModalOpen] = useState(false);
  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false);
  const [inventoryDetailModalOpen, setInventoryDetailModalOpen] = useState(false);
  const [createShipmentModalOpen, setCreateShipmentModalOpen] = useState(false);
  const [updateShipmentStatusModalOpen, setUpdateShipmentStatusModalOpen] = useState(false);

  const [selectedInventory, setSelectedInventory] = useState<InventoryResponse | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentResponse | null>(null);

  // Form states
  const [skuForm, setSkuForm] = useState({
    productId: '',
    code: '',
    name: '',
    initialQuantity: 10,
  });

  const [adjustForm, setAdjustForm] = useState({
    operation: 'INCREASE' as 'INCREASE' | 'DECREASE' | 'SET_AVAILABLE',
    quantity: 5,
    reason: 'Nhập hàng bổ sung',
  });

  const [shipmentForm, setShipmentForm] = useState({
    orderId: '',
    carrierName: 'VNPost Nhanh',
    trackingNumber: 'VNPOST-' + Math.floor(100000 + Math.random() * 900000),
  });

  const [newShipmentStatus, setNewShipmentStatus] = useState<'PENDING' | 'SHIPPED' | 'DELIVERED'>('SHIPPED');

  const loadFulfillmentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, skuRes, prodRes] = await Promise.all([
        sellerFulfillmentApi.listInventories().catch(() => ({ content: [] })),
        sellerFulfillmentApi.listSkus().catch(() => ({ content: [] })),
        sellerCatalogApi.listProducts().catch(() => ({ content: [] })),
      ]);
      setInventories(invRes?.content || []);
      setSkus(skuRes?.content || []);
      setProducts(prodRes?.content || []);
      if (prodRes?.content?.length && !skuForm.productId) {
        setSkuForm((prev) => ({ ...prev, productId: prodRes.content[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu Fulfillment từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFulfillmentData();
  }, [activeTab]);

  // API 1: POST /api/v1/seller/fulfillment/skus (FR-05)
  const handleCreateSku = async () => {
    if (!skuForm.productId || !skuForm.code.trim() || !skuForm.name.trim()) {
      alert('Vui lòng chọn sản phẩm và nhập mã SKU, tên quy cách.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sellerFulfillmentApi.createSku({
        productId: skuForm.productId,
        code: skuForm.code.trim(),
        name: skuForm.name.trim(),
        initialQuantity: Number(skuForm.initialQuantity),
      });
      setSuccessMsg('Tạo SKU và tồn kho ban đầu thành công qua API POST /api/v1/seller/fulfillment/skus!');
      setCreateSkuModalOpen(false);
      setSkuForm({ productId: products[0]?.id || '', code: '', name: '', initialQuantity: 10 });
      loadFulfillmentData();
    } catch (err: any) {
      alert(err.message || 'Tạo SKU thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // API 2: PATCH /api/v1/seller/fulfillment/inventories/{id} (FR-14)
  const handleAdjustStock = async () => {
    if (!selectedInventory) return;
    setIsSubmitting(true);
    try {
      await sellerFulfillmentApi.updateInventory(selectedInventory.id, {
        operation: adjustForm.operation,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason.trim() || undefined,
      });
      setSuccessMsg(`Điều chỉnh tồn kho cho ${selectedInventory.skuCode} thành công qua API PATCH!`);
      setAdjustStockModalOpen(false);
      loadFulfillmentData();
    } catch (err: any) {
      alert(err.message || 'Điều chỉnh tồn kho thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // API 3: POST /api/v1/seller/fulfillment/shipments (FR-38)
  const handleCreateShipment = async () => {
    if (!shipmentForm.orderId.trim() || !shipmentForm.trackingNumber.trim()) {
      alert('Vui lòng nhập mã đơn hàng (UUID) và mã vận đơn tracking.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sellerFulfillmentApi.createShipment({
        orderId: shipmentForm.orderId.trim(),
        carrierName: shipmentForm.carrierName,
        trackingNumber: shipmentForm.trackingNumber.trim(),
      });
      setSuccessMsg('Tạo vận đơn thật thành công qua API POST /api/v1/seller/fulfillment/shipments!');
      setCreateShipmentModalOpen(false);
      loadFulfillmentData();
    } catch (err: any) {
      alert(err.message || 'Tạo vận đơn thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // API 4: PATCH /api/v1/seller/fulfillment/shipments/{id}/status (FR-39)
  const handleUpdateShipmentStatus = async () => {
    if (!selectedShipment) return;
    setIsSubmitting(true);
    try {
      await sellerFulfillmentApi.updateShipmentStatus(selectedShipment.id, {
        status: newShipmentStatus,
      });
      setSuccessMsg(`Cập nhật trạng thái vận đơn ${selectedShipment.id} thành công qua API PATCH!`);
      setUpdateShipmentStatusModalOpen(false);
      loadFulfillmentData();
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái vận đơn thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="nx-seller-page-header">
        <div>
          <h2 className="nx-seller-page-title">Quản lý Tồn kho & Vận chuyển</h2>
          <p className="nx-seller-page-desc">
            Kết nối trực tiếp 7 API Fulfillment Seller: Quản lý SKU (FR-05), Tồn kho (FR-13, FR-14), Vận đơn (FR-38, FR-39)
          </p>
        </div>

        <div className="d-flex gap-2">
          {/* API: POST /api/v1/seller/fulfillment/skus */}
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setCreateSkuModalOpen(true)}
          >
            <span className="nx-api-badge post">POST</span>
            <i className="bi bi-box"></i>
            <span>Tạo SKU mới (FR-05)</span>
          </button>

          {/* API: POST /api/v1/seller/fulfillment/shipments */}
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setCreateShipmentModalOpen(true)}
          >
            <span className="nx-api-badge post">POST</span>
            <i className="bi bi-truck"></i>
            <span>Tạo vận đơn (FR-38)</span>
          </button>
        </div>
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

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold ${activeTab === 'inventory' ? 'active text-primary' : 'text-secondary'}`}
            type="button"
            onClick={() => setActiveTab('inventory')}
          >
            <i className="bi bi-boxes me-2"></i>
            Tồn kho theo SKU (FR-13, FR-14) ({inventories.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold ${activeTab === 'skus' ? 'active text-primary' : 'text-secondary'}`}
            type="button"
            onClick={() => setActiveTab('skus')}
          >
            <i className="bi bi-tags me-2"></i>
            Danh sách SKU của bạn (FR-05) ({skus.length})
          </button>
        </li>
      </ul>

      {/* Tab 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="nx-seller-card p-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2 mb-0">Đang tải tồn kho thật từ cơ sở dữ liệu...</p>
            </div>
          ) : inventories.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-boxes fs-1 text-muted"></i>
              <h5 className="mt-3 fw-bold">Chưa có bản ghi tồn kho nào</h5>
              <p className="text-muted small">Hãy bấm nút "Tạo SKU mới" ở trên để sinh mã SKU và nạp tồn kho vào kho hàng mặc định!</p>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setCreateSkuModalOpen(true)}
              >
                + Tạo SKU & Nạp tồn kho ngay
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="nx-seller-table">
                <thead>
                  <tr>
                    <th>Mã Inventory ID</th>
                    <th>Mã SKU / Tên mặt hàng</th>
                    <th>Kho lưu trữ</th>
                    <th>Tồn thực tế</th>
                    <th>Đang giữ (Order)</th>
                    <th>Có thể bán</th>
                    <th>Trạng thái</th>
                    <th className="text-end">Hành động API Thật</th>
                  </tr>
                </thead>
                <tbody>
                  {inventories.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <span className="font-monospace text-muted small">{inv.id.slice(0, 8)}...</span>
                      </td>
                      <td>
                        <span className="font-monospace fw-bold text-dark">{inv.skuCode || 'SKU'}</span>
                        <div className="text-primary small">{inv.skuName || 'Quy cách'}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border">
                          {inv.warehouseName || inv.warehouseId?.slice(0, 8)}
                        </span>
                      </td>
                      <td className="fw-bold">{inv.quantityOnHand}</td>
                      <td className="text-muted">{inv.quantityReserved}</td>
                      <td>
                        <span className="fw-bold text-success fs-6">{inv.availableQuantity} chiếc</span>
                      </td>
                      <td>
                        <span className={`nx-badge ${inv.status === 'IN_STOCK' ? 'nx-badge-success' : inv.status === 'LOW_STOCK' ? 'nx-badge-warning' : 'nx-badge-danger'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {/* API: GET /api/v1/seller/fulfillment/inventories/{id} */}
                          <button
                            type="button"
                            className="btn btn-outline-info d-inline-flex align-items-center gap-1"
                            onClick={() => {
                              setSelectedInventory(inv);
                              setInventoryDetailModalOpen(true);
                            }}
                            title="Chi tiết tồn kho (FR-13)"
                          >
                            <span className="nx-api-badge get" style={{ fontSize: '9px' }}>GET</span>
                            <span>Chi tiết</span>
                          </button>

                          {/* API: PATCH /api/v1/seller/fulfillment/inventories/{id} */}
                          <button
                            type="button"
                            className="btn btn-outline-warning d-inline-flex align-items-center gap-1"
                            onClick={() => {
                              setSelectedInventory(inv);
                              setAdjustForm({ operation: 'INCREASE', quantity: 5, reason: 'Nhập bổ sung' });
                              setAdjustStockModalOpen(true);
                            }}
                            title="Điều chỉnh tăng/giảm tồn kho (FR-14)"
                          >
                            <span className="nx-api-badge patch" style={{ fontSize: '9px' }}>PATCH</span>
                            <span>Điều chỉnh</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: SKUs Table */}
      {activeTab === 'skus' && (
        <div className="nx-seller-card p-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2 mb-0">Đang tải SKU...</p>
            </div>
          ) : skus.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-tags fs-1 text-muted"></i>
              <h5 className="mt-3 fw-bold">Chưa có mã SKU nào</h5>
              <p className="text-muted small">Bấm nút "Tạo SKU mới" để khởi tạo mã định danh sản phẩm!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="nx-seller-table">
                <thead>
                  <tr>
                    <th>Mã SKU Code</th>
                    <th>Tên quy cách SKU</th>
                    <th>Thuộc Product ID</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {skus.map((sku) => (
                    <tr key={sku.id}>
                      <td className="font-monospace fw-bold text-dark">{sku.code}</td>
                      <td className="fw-semibold text-primary">{sku.name}</td>
                      <td className="font-monospace text-muted small">{sku.productId}</td>
                      <td className="text-muted small">{sku.createdAt ? new Date(sku.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Create SKU (POST /api/v1/seller/fulfillment/skus) */}
      <SellerModal
        isOpen={createSkuModalOpen}
        onClose={() => setCreateSkuModalOpen(false)}
        title="Tạo SKU kèm tồn kho ban đầu (POST /api/v1/seller/fulfillment/skus)"
        apiBadge={{ method: 'POST', endpoint: '/api/v1/seller/fulfillment/skus' }}
        onSubmit={handleCreateSku}
        isSubmitting={isSubmitting}
        submitText="Gửi API Tạo SKU (POST)"
      >
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label fw-semibold">Gán cho Sản phẩm (*)</label>
            <select
              className="form-select"
              value={skuForm.productId}
              onChange={(e) => setSkuForm({ ...skuForm, productId: e.target.value })}
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
            <label className="form-label fw-semibold">Mã SKU Code (*)</label>
            <input
              type="text"
              className="form-control font-monospace"
              placeholder="VD: SKU-PROD-2026"
              value={skuForm.code}
              onChange={(e) => setSkuForm({ ...skuForm, code: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label fw-semibold">Tên quy cách SKU (*)</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Hộp nguyên seal / Bản giới hạn"
              value={skuForm.name}
              onChange={(e) => setSkuForm({ ...skuForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label fw-semibold">Số lượng nhập tồn ban đầu</label>
            <input
              type="number"
              className="form-control"
              value={skuForm.initialQuantity}
              onChange={(e) => setSkuForm({ ...skuForm, initialQuantity: Number(e.target.value) })}
              min={0}
            />
          </div>
        </div>
      </SellerModal>

      {/* Modal 2: Adjust Inventory (PATCH /api/v1/seller/fulfillment/inventories/{id}) */}
      <SellerModal
        isOpen={adjustStockModalOpen}
        onClose={() => setAdjustStockModalOpen(false)}
        title={`Điều chỉnh tồn kho: ${selectedInventory?.skuCode || selectedInventory?.id} (FR-14)`}
        apiBadge={{ method: 'PATCH', endpoint: `/api/v1/seller/fulfillment/inventories/${selectedInventory?.id || '{id}'}` }}
        onSubmit={handleAdjustStock}
        isSubmitting={isSubmitting}
        submitText="Gửi API Điều Chỉnh (PATCH)"
      >
        <div className="d-flex flex-column gap-3">
          <div className="p-2 bg-light rounded border">
            <div>Tồn kho khả dụng hiện tại: <strong className="text-primary">{selectedInventory?.availableQuantity}</strong> chiếc</div>
          </div>
          <div>
            <label className="form-label fw-semibold">Loại thao tác điều chỉnh (*)</label>
            <select
              className="form-select"
              value={adjustForm.operation}
              onChange={(e) => setAdjustForm({ ...adjustForm, operation: e.target.value as any })}
            >
              <option value="INCREASE">Tăng thêm số lượng (INCREASE)</option>
              <option value="DECREASE">Giảm bớt số lượng (DECREASE)</option>
              <option value="SET_AVAILABLE">Đặt lại số lượng khả dụng (SET_AVAILABLE)</option>
            </select>
          </div>
          <div>
            <label className="form-label fw-semibold">Số lượng (*)</label>
            <input
              type="number"
              className="form-control"
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
              min={0}
              required
            />
          </div>
          <div>
            <label className="form-label fw-semibold">Lý do điều chỉnh</label>
            <input
              type="text"
              className="form-control"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            />
          </div>
        </div>
      </SellerModal>

      {/* Modal 3: View Details (GET /api/v1/seller/fulfillment/inventories/{id}) */}
      <SellerModal
        isOpen={inventoryDetailModalOpen}
        onClose={() => setInventoryDetailModalOpen(false)}
        title="Chi tiết tồn kho từ Backend (FR-13)"
        apiBadge={{ method: 'GET', endpoint: `/api/v1/seller/fulfillment/inventories/${selectedInventory?.id || '{id}'}` }}
      >
        <div className="d-flex flex-column gap-2">
          <div className="d-flex justify-content-between border-bottom pb-2">
            <span className="text-muted">Inventory ID:</span>
            <span className="font-monospace fw-bold">{selectedInventory?.id}</span>
          </div>
          <div className="d-flex justify-content-between border-bottom pb-2">
            <span className="text-muted">SKU Code:</span>
            <span className="font-monospace">{selectedInventory?.skuCode || '-'}</span>
          </div>
          <div className="d-flex justify-content-between border-bottom pb-2">
            <span className="text-muted">Kho lưu trữ:</span>
            <span>{selectedInventory?.warehouseName || selectedInventory?.warehouseId}</span>
          </div>
          <div className="d-flex justify-content-between border-bottom pb-2">
            <span className="text-muted">Tổng tồn kho (On Hand):</span>
            <span className="fw-bold">{selectedInventory?.quantityOnHand}</span>
          </div>
          <div className="d-flex justify-content-between border-bottom pb-2">
            <span className="text-muted">Đang giữ đơn (Reserved):</span>
            <span className="text-warning fw-bold">{selectedInventory?.quantityReserved}</span>
          </div>
          <div className="d-flex justify-content-between pt-1">
            <span className="text-muted">Khả dụng (Available):</span>
            <span className="text-success fw-bold fs-6">{selectedInventory?.availableQuantity} chiếc</span>
          </div>
        </div>
      </SellerModal>

      {/* Modal 4: Create Shipment (POST /api/v1/seller/fulfillment/shipments) */}
      <SellerModal
        isOpen={createShipmentModalOpen}
        onClose={() => setCreateShipmentModalOpen(false)}
        title="Tạo vận đơn thật (POST /api/v1/seller/fulfillment/shipments)"
        apiBadge={{ method: 'POST', endpoint: '/api/v1/seller/fulfillment/shipments' }}
        onSubmit={handleCreateShipment}
        isSubmitting={isSubmitting}
        submitText="Gửi API Tạo Vận Đơn (POST)"
      >
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label fw-semibold">Mã đơn hàng Order ID (UUID) (*)</label>
            <input
              type="text"
              className="form-control font-monospace"
              placeholder="VD: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
              value={shipmentForm.orderId}
              onChange={(e) => setShipmentForm({ ...shipmentForm, orderId: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label fw-semibold">Đơn vị vận chuyển (*)</label>
            <input
              type="text"
              className="form-control"
              value={shipmentForm.carrierName}
              onChange={(e) => setShipmentForm({ ...shipmentForm, carrierName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label fw-semibold">Mã tra cứu vận đơn Tracking Number (*)</label>
            <input
              type="text"
              className="form-control font-monospace"
              value={shipmentForm.trackingNumber}
              onChange={(e) => setShipmentForm({ ...shipmentForm, trackingNumber: e.target.value })}
              required
            />
          </div>
        </div>
      </SellerModal>
    </div>
  );
}

export default SellerFulfillmentPage;
