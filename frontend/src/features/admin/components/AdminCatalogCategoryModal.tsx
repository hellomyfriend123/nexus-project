import AdminModal from '../components/AdminModal';
import type { useAdminCatalog } from '../hooks/useAdminCatalog';

export function AdminCatalogCategoryModal(model: ReturnType<typeof useAdminCatalog>) {
  const { selectedCategory, showCategoryModal, setShowCategoryModal, categoryForm, setCategoryForm, handleSaveCategory } = model;
  return (
    <AdminModal
      isOpen={showCategoryModal}
      onClose={() => setShowCategoryModal(false)}
      title={selectedCategory ? 'Cập nhật danh mục hàng hoá' : 'Tạo mới danh mục hàng hoá'}
    >
      <form onSubmit={handleSaveCategory}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Tên danh mục *
            </label>
            <input
              type="text"
              required
              className="form-control"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="Ví dụ: Đồ gia dụng cao cấp"
            />
          </div>
          {selectedCategory && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Trạng thái hoạt động *
              </label>
              <select
                className="form-control"
                value={categoryForm.status}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    status: e.target.value as 'ACTIVE' | 'INACTIVE',
                  })
                }
              >
                <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
                <option value="INACTIVE">INACTIVE (Đã xoá mềm / Ngừng)</option>
              </select>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Mô tả danh mục
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Mô tả tóm tắt cho các mặt hàng trong danh mục này..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              onClick={() => setShowCategoryModal(false)}
            >
              Huỷ
            </button>
            <button type="submit" className="nx-btn nx-btn-primary">
              {selectedCategory ? 'Lưu cập nhật' : 'Tạo danh mục'}
            </button>
          </div>
        </div>
      </form>
    </AdminModal>
  );
}
