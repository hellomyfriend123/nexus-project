import { useState, useEffect, useCallback } from 'react';
import AdminModal from '../components/AdminModal';
import { adminCatalogApi } from '../../../services/api/adminApi';
import type {
  AdminCategory,
  AdminProduct,
  AdminReview,
  ProductStatus,
} from '../../../features/admin/types/admin.types';

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'reviews'>('categories');
  const [loading, setLoading] = useState(false);
  const [isUsingRealApi, setIsUsingRealApi] = useState(false);

  // Categories State (5 tasks)
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<{
    name: string;
    description: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({ name: '', description: '', status: 'ACTIVE' });

  // Products State (3 tasks)
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productKeyword, setProductKeyword] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');

  // Reviews State (2 tasks)
  const [reviews, setReviews] = useState<AdminReview[]>([]);

  // FETCH DATA
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'categories') {
        const res = await adminCatalogApi.listCategories({
          status: categoryStatusFilter === 'ALL' ? undefined : categoryStatusFilter,
        });
        if (res && Array.isArray(res.content)) {
          setCategories(res.content);
          setIsUsingRealApi(true);
        } else {
          setCategories([]);
        }
      } else if (activeTab === 'products') {
        const res = await adminCatalogApi.listProducts({
          keyword: productKeyword || undefined,
          categoryId: productCategoryFilter === 'ALL' ? undefined : productCategoryFilter,
        });
        if (res && Array.isArray(res.content)) {
          setProducts(res.content);
          setIsUsingRealApi(true);
        } else {
          setProducts([]);
        }
      } else if (activeTab === 'reviews') {
        const res = await adminCatalogApi.listReviews();
        if (res && Array.isArray(res.content)) {
          setReviews(res.content);
          setIsUsingRealApi(true);
        } else {
          setReviews([]);
        }
      }
    } catch {
      setIsUsingRealApi(false);
      if (activeTab === 'categories') setCategories([]);
      else if (activeTab === 'products') setProducts([]);
      else if (activeTab === 'reviews') setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, categoryStatusFilter, productKeyword, productCategoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // CATEGORY HANDLERS
  const handleOpenCategoryCreate = () => {
    setSelectedCategory(null);
    setCategoryForm({ name: '', description: '', status: 'ACTIVE' });
    setShowCategoryModal(true);
  };

  const handleOpenCategoryEdit = async (cat: AdminCategory) => {
    setSelectedCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || '',
      status: (cat.status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
    });
    setShowCategoryModal(true);
    try {
      const freshCat = await adminCatalogApi.getCategory(cat.id);
      if (freshCat) {
        setSelectedCategory(freshCat);
        setCategoryForm({
          name: freshCat.name,
          description: freshCat.description || '',
          status: (freshCat.status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
        });
      }
    } catch {
      // Giữ dữ liệu hiện tại nếu lỗi gọi API chi tiết
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      if (selectedCategory) {
        await adminCatalogApi.updateCategory(selectedCategory.id, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          status: categoryForm.status,
          sortOrder: (selectedCategory as any).sortOrder ?? 0,
          parentId: (selectedCategory as any).parentId ?? null,
        } as any);
        alert('Đã cập nhật danh mục thành công qua REST API!');
      } else {
        await adminCatalogApi.createCategory({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
        });
        alert('Đã tạo danh mục mới thành công qua REST API!');
      }
      setShowCategoryModal(false);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi lưu danh mục từ máy chủ';
      alert(`Không thể lưu danh mục:\n${errorMsg}`);
    }
  };

  const handleDeleteCategory = async (cat: AdminCategory) => {
    if (
      confirm(
        `Bạn có chắc chắn muốn xoá mềm danh mục "${cat.name}"?\n(Theo quy định nghiệp vụ Backend FR-09/54: Danh mục sẽ được chuyển sang trạng thái INACTIVE để đảm bảo toàn vẹn dữ liệu)`
      )
    ) {
      try {
        await adminCatalogApi.deleteCategory(cat.id);
        alert(`Đã xoá mềm danh mục "${cat.name}" thành công! Trạng thái đã chuyển sang INACTIVE.`);
        loadData();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
        alert(`Không thể xoá danh mục:\n${errorMsg}`);
      }
    }
  };

  // PRODUCT HANDLERS
  const handleToggleProductStatus = async (id: string, currentStatus: ProductStatus) => {
    const nextStatus: ProductStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminCatalogApi.updateProductStatus(id, nextStatus);
      alert(`Đã đổi trạng thái sản phẩm sang ${nextStatus} trên Supabase!`);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể đổi trạng thái sản phẩm:\n${errorMsg}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xoá mềm sản phẩm này?')) {
      try {
        await adminCatalogApi.deleteProduct(id);
        alert('Đã xoá mềm sản phẩm qua REST API!');
        loadData();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
        alert(`Không thể xoá sản phẩm:\n${errorMsg}`);
      }
    }
  };

  // REVIEW HANDLERS
  const handleApproveReview = async (id: string) => {
    try {
      await adminCatalogApi.updateReviewStatus(id, 'APPROVED');
      alert('Đã phê duyệt đánh giá sản phẩm qua REST API!');
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể phê duyệt đánh giá:\n${errorMsg}`);
    }
  };

  const handleRejectReview = async (id: string) => {
    try {
      await adminCatalogApi.updateReviewStatus(id, 'REJECTED');
      alert('Đã ẩn đánh giá sản phẩm qua REST API!');
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể ẩn đánh giá:\n${errorMsg}`);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchName =
      (p.name || '').toLowerCase().includes(productKeyword.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(productKeyword.toLowerCase());
    const matchCat =
      productCategoryFilter === 'ALL' || p.categoryId === productCategoryFilter;
    return matchName && matchCat;
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div>
      <div className="nx-page-header">
        <div>
          <h1 className="nx-page-title">Quản trị Catalog (FR-08, 09, 45, 53, 54, 59)</h1>
          <p className="nx-page-subtitle">
            Kết nối REST API: <code>/api/v1/admin/catalog/*</code>
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

      {/* Tabs */}
      <div className="nx-tabs">
        <button
          type="button"
          className={`nx-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <i className="bi bi-folder me-1"></i> Danh mục sản phẩm (5 tasks)
        </button>
        <button
          type="button"
          className={`nx-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <i className="bi bi-box me-1"></i> Sản phẩm trên sàn (3 tasks)
        </button>
        <button
          type="button"
          className={`nx-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <i className="bi bi-star-half me-1"></i> Kiểm duyệt đánh giá (2 tasks)
        </button>
      </div>

      {/* TAB 1: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="nx-admin-card">
          <div className="nx-admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 className="nx-admin-card-title">Danh sách Danh mục hàng hoá (FR-09, FR-54)</h2>
              <select
                value={categoryStatusFilter}
                onChange={(e) => setCategoryStatusFilter(e.target.value)}
                style={{
                  fontSize: '12.5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
                <option value="INACTIVE">INACTIVE (Đã xoá mềm / Ngừng)</option>
              </select>
            </div>
            <button
              type="button"
              className="nx-btn nx-btn-primary nx-btn-sm"
              onClick={handleOpenCategoryCreate}
            >
              <i className="bi bi-plus-lg"></i> Thêm danh mục mới
            </button>
          </div>
          <div className="nx-table-container">
            <table className="nx-admin-table">
              <thead>
                <tr>
                  <th>Tên danh mục</th>
                  <th>Mô tả</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      Không có danh mục nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <strong>{cat.name}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          ID: <code>{cat.id.slice(0, 8)}...</code>
                        </div>
                      </td>
                      <td>{cat.description || '—'}</td>
                      <td>
                        <span
                          className={`nx-badge ${
                            (cat.status || 'ACTIVE') === 'ACTIVE'
                              ? 'nx-badge-success'
                              : 'nx-badge-secondary'
                          }`}
                        >
                          {(cat.status || 'ACTIVE') === 'ACTIVE'
                            ? 'ACTIVE (Hoạt động)'
                            : 'INACTIVE (Đã xoá mềm)'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="nx-btn nx-btn-outline nx-btn-sm"
                            onClick={() => handleOpenCategoryEdit(cat)}
                            title="Cập nhật danh mục (PUT /api/v1/admin/catalog/categories/{id})"
                          >
                            <i className="bi bi-pencil"></i> Sửa
                          </button>
                          {(cat.status || 'ACTIVE') === 'ACTIVE' && (
                            <button
                              type="button"
                              className="nx-btn nx-btn-danger nx-btn-sm"
                              onClick={() => handleDeleteCategory(cat)}
                              title="Xoá mềm danh mục (DELETE /api/v1/admin/catalog/categories/{id})"
                            >
                              <i className="bi bi-trash"></i> Xoá
                            </button>
                          )}
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

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="nx-admin-card">
          <div className="nx-filter-bar">
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={productKeyword}
              onChange={(e) => setProductKeyword(e.target.value)}
              style={{ width: '280px' }}
            />
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="nx-table-container">
            <table className="nx-admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá niêm yết</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      Không có sản phẩm nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const displayPrice = (p as any).basePrice ?? p.price ?? 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div>
                            <strong>{p.name}</strong>
                          </div>
                          <code style={{ fontSize: '11px', color: '#64748b' }}>
                            ID: {p.id.slice(0, 8)}...
                          </code>
                        </td>
                        <td>{p.categoryName || 'Mặc định'}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>
                          {formatCurrency(displayPrice)}
                        </td>
                        <td>
                          <span
                            className={`nx-badge ${
                              p.status === 'ACTIVE'
                                ? 'nx-badge-success'
                                : p.status === 'INACTIVE'
                                  ? 'nx-badge-danger'
                                  : 'nx-badge-secondary'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="nx-btn nx-btn-outline nx-btn-sm"
                              onClick={() => handleToggleProductStatus(p.id, p.status)}
                              title="Đổi trạng thái ACTIVE/INACTIVE (PATCH /api/v1/admin/catalog/products/{id}/status)"
                            >
                              <i className="bi bi-arrow-repeat"></i> Trạng thái
                            </button>
                            <button
                              type="button"
                              className="nx-btn nx-btn-danger nx-btn-sm"
                              onClick={() => handleDeleteProduct(p.id)}
                              title="Xoá mềm sản phẩm (DELETE /api/v1/admin/catalog/products/{id})"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="nx-admin-card">
          <div className="nx-admin-card-header">
            <h2 className="nx-admin-card-title">Kiểm duyệt đánh giá sản phẩm (FR-45, FR-59)</h2>
          </div>
          <div className="nx-table-container">
            <table className="nx-admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Người đánh giá</th>
                  <th>Số sao</th>
                  <th>Nội dung bình luận</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác kiểm duyệt</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.productName}</strong>
                    </td>
                    <td>{r.userFullName}</td>
                    <td>
                      <span style={{ color: '#eab308' }}>
                        {'★'.repeat(r.rating)}
                        {'☆'.repeat(5 - r.rating)}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px' }}>"{r.comment}"</td>
                    <td>
                      <span
                        className={`nx-badge ${r.status === 'APPROVED' || (r.status as string) === 'VISIBLE'
                            ? 'nx-badge-success'
                            : r.status === 'REJECTED' || (r.status as string) === 'HIDDEN'
                              ? 'nx-badge-danger'
                              : 'nx-badge-warning'
                          }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {r.status !== 'APPROVED' && (r.status as string) !== 'VISIBLE' && (
                          <button
                            type="button"
                            className="nx-btn nx-btn-primary nx-btn-sm"
                            onClick={() => handleApproveReview(r.id)}
                          >
                            <i className="bi bi-check-lg"></i> Duyệt
                          </button>
                        )}
                        {r.status !== 'REJECTED' && (r.status as string) !== 'HIDDEN' && (
                          <button
                            type="button"
                            className="nx-btn nx-btn-outline nx-btn-sm"
                            style={{ color: '#dc2626' }}
                            onClick={() => handleRejectReview(r.id)}
                          >
                            <i className="bi bi-eye-slash"></i> Ẩn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Create/Edit Modal */}
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
    </div>
  );
}

export default AdminCatalogPage;
