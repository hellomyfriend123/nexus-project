import { useState, useEffect, useCallback } from 'react';
import AdminModal from '../components/AdminModal';
import { adminFulfillmentApi } from '../../../services/api/adminApi';
import type {
  AdminInventoryItem,
  AdminWarehouse,
} from '../../../features/admin/types/admin.types';

export function AdminFulfillmentPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'warehouses'>('inventory');
  const [loading, setLoading] = useState(false);
  const [isUsingRealApi, setIsUsingRealApi] = useState(false);

  // Inventory State (1 task)
  const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');

  // Warehouse State (4 tasks)
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<AdminWarehouse | null>(null);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    address: '',
  });

  // FETCH DATA
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const res = await adminFulfillmentApi.listInventories({
          warehouseId: warehouseFilter === 'ALL' ? undefined : warehouseFilter,
          status: stockStatusFilter === 'ALL' ? undefined : stockStatusFilter,
        });
        if (res && Array.isArray(res.content)) {
          setInventory(res.content);
          setIsUsingRealApi(true);
        } else {
          setInventory([]);
        }
      } else if (activeTab === 'warehouses') {
        const res = await adminFulfillmentApi.listWarehouses();
        if (res && Array.isArray(res.content)) {
          setWarehouses(res.content);
          setIsUsingRealApi(true);
        } else {
          setWarehouses([]);
        }
      }
    } catch {
      setIsUsingRealApi(false);
      if (activeTab === 'inventory') setInventory([]);
      else if (activeTab === 'warehouses') setWarehouses([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, warehouseFilter, stockStatusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // WAREHOUSE HANDLERS
  const handleOpenCreateWarehouse = () => {
    setSelectedWarehouse(null);
    setWarehouseForm({
      name: '',
      code: '',
      address: '',
    });
    setShowWarehouseModal(true);
  };

  const handleOpenEditWarehouse = async (wh: AdminWarehouse) => {
    setSelectedWarehouse(wh);
    setWarehouseForm({
      name: wh.name,
      code: wh.code,
      address: wh.address || '',
    });
    setShowWarehouseModal(true);
    try {
      const freshWh = await adminFulfillmentApi.getWarehouse(wh.id);
      if (freshWh) {
        setSelectedWarehouse(freshWh);
        setWarehouseForm({
          name: freshWh.name,
          code: freshWh.code,
          address: freshWh.address || '',
        });
      }
    } catch {
      // Giữ thông tin hiện tại nếu lỗi gọi API chi tiết
    }
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseForm.name.trim() || !warehouseForm.address.trim()) return;

    try {
      if (selectedWarehouse) {
        await adminFulfillmentApi.updateWarehouse(selectedWarehouse.id, {
          name: warehouseForm.name.trim(),
          address: warehouseForm.address.trim(),
          status: (selectedWarehouse.status || 'ACTIVE') as any,
        });
        alert('Đã cập nhật thông tin kho hàng qua REST API!');
      } else {
        if (!warehouseForm.code.trim()) return;
        await adminFulfillmentApi.createWarehouse({
          name: warehouseForm.name.trim(),
          code: warehouseForm.code.trim().toUpperCase(),
          address: warehouseForm.address.trim(),
        });
        alert('Đã tạo mới kho hàng trong hệ thống qua REST API!');
      }
      setShowWarehouseModal(false);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể lưu kho hàng:\n${errorMsg}`);
    }
  };

  const handleToggleWarehouseStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const wh = warehouses.find((w) => w.id === id);
      await adminFulfillmentApi.updateWarehouse(id, {
        name: wh?.name || 'Kho hàng',
        address: wh?.address || '',
        status: nextStatus as any,
      });
      alert(`Đã đổi trạng thái kho hàng sang ${nextStatus} qua REST API!`);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể đổi trạng thái kho hàng:\n${errorMsg}`);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchWh = warehouseFilter === 'ALL' || item.warehouseId === warehouseFilter;
    const matchStatus = stockStatusFilter === 'ALL' || item.status === stockStatusFilter;
    return matchWh && matchStatus;
  });

  return (
    <div>
      <div className="nx-page-header">
        <div>
          <h1 className="nx-page-title">Quản trị Fulfillment & Kho bãi (FR-55)</h1>
          <p className="nx-page-subtitle">
            Kết nối REST API: <code>/api/v1/admin/fulfillment/*</code>
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
        <button
          type="button"
          className="nx-btn nx-btn-outline"
          onClick={() => loadData()}
          disabled={loading}
        >
          <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Làm mới
        </button>
      </div>

      <div className="nx-tabs">
        <button
          type="button"
          className={`nx-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <i className="bi bi-box-seam me-1"></i> Giám sát tồn kho (1 task)
        </button>
        <button
          type="button"
          className={`nx-tab-btn ${activeTab === 'warehouses' ? 'active' : ''}`}
          onClick={() => setActiveTab('warehouses')}
        >
          <i className="bi bi-buildings me-1"></i> Mạng lưới kho hàng (4 tasks)
        </button>
      </div>

      {/* TAB 1: INVENTORY TRACKING */}
      {activeTab === 'inventory' && (
        <div className="nx-admin-card">
          <div className="nx-filter-bar">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
            >
              <option value="ALL">Tất cả kho lưu trữ</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>

            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả mức tồn</option>
              <option value="IN_STOCK">IN_STOCK (Còn hàng)</option>
              <option value="LOW_STOCK">LOW_STOCK (Sắp hết)</option>
              <option value="OUT_OF_STOCK">OUT_OF_STOCK (Hết hàng)</option>
            </select>
          </div>

          <div className="nx-table-container">
            <table className="nx-admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm / SKU</th>
                  <th>Kho lưu trữ</th>
                  <th>Thực tồn (On Hand)</th>
                  <th>Đang giữ (Reserved)</th>
                  <th>Khả dụng (Available)</th>
                  <th>Mức cảnh báo</th>
                  <th>Tình trạng</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.productName || (item as any).skuName || 'Sản phẩm'}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        SKU: {item.sku || (item as any).skuCode}
                      </div>
                    </td>
                    <td>{item.warehouseName || warehouses.find((w) => w.id === item.warehouseId)?.name || 'Kho hàng'}</td>
                    <td style={{ fontWeight: 600 }}>{item.quantityOnHand ?? (item as any).totalQuantity ?? 0}</td>
                    <td style={{ color: '#d97706' }}>{item.quantityReserved ?? 0}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>
                      {item.quantityAvailable ?? (item as any).availableQuantity ?? 0}
                    </td>
                    <td style={{ color: '#64748b' }}>{item.reorderLevel ?? '—'}</td>
                    <td>
                      <span
                        className={`nx-badge ${
                          item.status === 'IN_STOCK'
                            ? 'nx-badge-success'
                            : item.status === 'LOW_STOCK'
                              ? 'nx-badge-warning'
                              : 'nx-badge-danger'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WAREHOUSES */}
      {activeTab === 'warehouses' && (
        <div className="nx-admin-card">
          <div className="nx-admin-card-header">
            <h2 className="nx-admin-card-title">Danh sách Trung tâm Vận hành & Kho hàng (FR-55)</h2>
            <button
              type="button"
              className="nx-btn nx-btn-primary nx-btn-sm"
              onClick={handleOpenCreateWarehouse}
            >
              <i className="bi bi-plus-lg"></i> Thêm kho mới
            </button>
          </div>
          <div className="nx-table-container">
            <table className="nx-admin-table">
              <thead>
                <tr>
                  <th>Tên kho / Mã</th>
                  <th>Địa chỉ kho hàng</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      Chưa có kho hàng nào trong hệ thống.
                    </td>
                  </tr>
                ) : (
                  warehouses.map((wh) => (
                    <tr key={wh.id}>
                      <td>
                        <div>
                          <strong>{wh.name}</strong>
                        </div>
                        <code style={{ color: '#315bf4' }}>{wh.code}</code>
                      </td>
                      <td>
                        <div>{wh.address || '—'}</div>
                      </td>
                      <td>
                        <span
                          className={`nx-badge ${
                            wh.status === 'ACTIVE' ? 'nx-badge-success' : 'nx-badge-secondary'
                          }`}
                        >
                          {wh.status}
                        </span>
                      </td>
                      <td>
                        {wh.createdAt ? new Date(wh.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="nx-btn nx-btn-outline nx-btn-sm"
                            onClick={() => handleOpenEditWarehouse(wh)}
                            title="Sửa thông tin kho (PUT /api/v1/admin/fulfillment/warehouses/{id})"
                          >
                            <i className="bi bi-pencil"></i> Sửa
                          </button>
                          <button
                            type="button"
                            className={`nx-btn nx-btn-sm ${
                              wh.status === 'ACTIVE' ? 'nx-btn-danger' : 'nx-btn-primary'
                            }`}
                            onClick={() => handleToggleWarehouseStatus(wh.id, wh.status)}
                            title="Bật/Ngừng hoạt động kho (FR-55)"
                          >
                            {wh.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warehouse Modal */}
      <AdminModal
        isOpen={showWarehouseModal}
        onClose={() => setShowWarehouseModal(false)}
        title={selectedWarehouse ? 'Cập nhật kho hàng' : 'Tạo mới kho hàng trung tâm'}
      >
        <form onSubmit={handleSaveWarehouse}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>
                Tên kho hàng *
              </label>
              <input
                type="text"
                required
                className="form-control"
                value={warehouseForm.name}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                placeholder="VD: Kho trung tâm TP.HCM"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>
                Mã kho (Code) *
              </label>
              <input
                type="text"
                required
                disabled={Boolean(selectedWarehouse)}
                className="form-control"
                value={warehouseForm.code}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                placeholder="WH-HCM-01"
              />
              {selectedWarehouse && (
                <small style={{ color: '#64748b' }}>Mã kho không thể thay đổi sau khi tạo</small>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>
                Địa chỉ chi tiết *
              </label>
              <textarea
                required
                rows={2}
                className="form-control"
                value={warehouseForm.address}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                className="nx-btn nx-btn-outline"
                onClick={() => setShowWarehouseModal(false)}
              >
                Huỷ
              </button>
              <button type="submit" className="nx-btn nx-btn-primary">
                {selectedWarehouse ? 'Lưu cập nhật' : 'Tạo kho hàng'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}

export default AdminFulfillmentPage;
