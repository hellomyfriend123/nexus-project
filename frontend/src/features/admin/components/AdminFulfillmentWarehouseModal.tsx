import AdminModal from '../components/AdminModal';
import type { useAdminFulfillment } from '../hooks/useAdminFulfillment';

export function AdminFulfillmentWarehouseModal(model: ReturnType<typeof useAdminFulfillment>) {
  const { selectedWarehouse, showWarehouseModal, setShowWarehouseModal, warehouseForm, setWarehouseForm, handleSaveWarehouse } = model;
  return (
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
  );
}
