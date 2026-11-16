import { useState, useEffect } from 'react';
import SellerModal from '../components/SellerModal';
import { sellerCatalogApi } from '../sellerApi';
import type { ProductSummaryResponse, CategoryTreeResponse, ProductItemResponse } from '../sellerApi';

export function SellerCatalogPage() {
  const [products, setProducts] = useState<ProductSummaryResponse[]>([]);
  const [categories, setCategories] = useState<CategoryTreeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [changeCategoryModalOpen, setChangeCategoryModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductSummaryResponse | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    basePrice: 100000,
    categoryId: '',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    basePrice: 100000,
    imageUrl: '',
  });

  const [targetCategory, setTargetCategory] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        sellerCatalogApi.listProducts({
          keyword: searchTerm || undefined,
          categoryId: selectedCategoryFilter || undefined,
          status: selectedStatusFilter || undefined,
        }),
        sellerCatalogApi.listCategories(),
      ]);
      setProducts(prodRes?.content || []);
      setCategories(catRes || []);
      if (!createForm.categoryId && catRes && catRes.length > 0) {
        setCreateForm((prev) => ({ ...prev, categoryId: catRes[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách sản phẩm từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategoryFilter, selectedStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // API 1: POST /api/v1/seller/catalog/products (FR-05)
  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.categoryId) {
      alert('Vui lòng nhập tên sản phẩm và chọn danh mục.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await sellerCatalogApi.createProduct({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        basePrice: Number(createForm.basePrice),
        categoryId: createForm.categoryId,
        images: [
          {
            imageUrl: createForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
            isPrimary: true,
            displayOrder: 1,
          },
        ],
      });
      setSuccessMsg('Tạo sản phẩm thành công qua API POST /api/v1/seller/catalog/products!');
      setCreateModalOpen(false);
      setCreateForm({
        name: '',
        description: '',
        basePrice: 100000,
        categoryId: categories[0]?.id || '',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Tạo sản phẩm thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit modal: fetch product details first
  const handleOpenEdit = async (p: ProductSummaryResponse) => {
    setSelectedProduct(p);
    setIsSubmitting(true);
    try {
      const detail: ProductItemResponse = await sellerCatalogApi.getProductById(p.id);
      setEditForm({
        name: detail.name,
        description: detail.description || '',
        basePrice: detail.basePrice,
        imageUrl: detail.images?.[0]?.imageUrl || '',
      });
      setEditModalOpen(true);
    } catch (err: any) {
      alert('Không thể tải chi tiết sản phẩm: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // API 2: PUT /api/v1/seller/catalog/products/{id} (FR-07)
  const handleEdit = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await sellerCatalogApi.updateProduct(selectedProduct.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        basePrice: Number(editForm.basePrice),
        images: editForm.imageUrl.trim()
          ? [{ imageUrl: editForm.imageUrl.trim(), isPrimary: true, displayOrder: 1 }]
          : [],
      });
      setSuccessMsg(`Cập nhật sản phẩm ${selectedProduct.id} thành công qua API PUT!`);
      setEditModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Cập nhật thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // API 3: DELETE /api/v1/seller/catalog/products/{id} (FR-08)
  const handleDelete = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await sellerCatalogApi.deleteProduct(selectedProduct.id);
      setSuccessMsg(`Xoá mềm sản phẩm ${selectedProduct.id} thành công qua API DELETE!`);
      setDeleteModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Xóa thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // API 4: PATCH /api/v1/seller/catalog/products/{id}/category (FR-10)
  const handleChangeCategory = async () => {
    if (!selectedProduct || !targetCategory) return;
    setIsSubmitting(true);
    try {
      await sellerCatalogApi.assignCategory(selectedProduct.id, { categoryId: targetCategory });
      setSuccessMsg(`Đổi danh mục cho sản phẩm ${selectedProduct.id} thành công qua API PATCH!`);
      setChangeCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gán danh mục thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="nx-seller-page-header">
        <div>
          <h2 className="nx-seller-page-title">Quản lý Sản phẩm & Danh mục</h2>
          <p className="nx-seller-page-desc">
            Kết nối API Catalog Seller thật: POST tạo mới, PUT cập nhật, DELETE xoá mềm, PATCH đổi danh mục
          </p>
        </div>

        {/* API 1: POST /api/v1/seller/catalog/products */}
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
          onClick={() => setCreateModalOpen(true)}
        >
          <span className="nx-api-badge post">POST</span>
          <i className="bi bi-plus-lg"></i>
          <span>Thêm sản phẩm thật (FR-05)</span>
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

      {/* Filter and Search Bar */}
      <div className="nx-seller-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-3">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Tìm theo tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary px-3">
                Tìm kiếm
              </button>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="">Tất cả danh mục ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <select
              className="form-select"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">ACTIVE (Đang bán)</option>
              <option value="INACTIVE">INACTIVE (Tạm dừng)</option>
            </select>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="nx-seller-card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2 mb-0">Đang tải sản phẩm từ cơ sở dữ liệu...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-box-seam fs-1 text-muted"></i>
            <h5 className="mt-3 fw-bold">Chưa có sản phẩm nào</h5>
            <p className="text-muted small">Hãy bấm nút "Thêm sản phẩm thật" ở trên để đăng bán sản phẩm đầu tiên vào cơ sở dữ liệu!</p>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              + Đăng sản phẩm mới ngay
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="nx-seller-table">
              <thead>
                <tr>
                  <th>Ảnh & Mã SP</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá niêm yết</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-end">Thao tác Backend API</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {product.primaryImageUrl ? (
                          <img
                            src={product.primaryImageUrl}
                            alt=""
                            className="rounded object-fit-cover"
                            style={{ width: '40px', height: '40px' }}
                          />
                        ) : (
                          <div
                            className="rounded bg-light border d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '40px', height: '40px' }}
                          >
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                        <span className="font-monospace text-muted small">{product.id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold text-primary">{product.name}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {product.categoryName || 'Mặc định'}
                      </span>
                    </td>
                    <td className="fw-bold">{Number(product.basePrice).toLocaleString('vi-VN')} ₫</td>
                    <td>
                      <span className={`nx-badge ${product.status === 'ACTIVE' ? 'nx-badge-success' : 'nx-badge-secondary'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {/* API 2: PUT /api/v1/seller/catalog/products/{id} */}
                        <button
                          type="button"
                          className="btn btn-outline-warning d-inline-flex align-items-center gap-1"
                          onClick={() => handleOpenEdit(product)}
                          title="Cập nhật sản phẩm thật (FR-07)"
                        >
                          <span className="nx-api-badge put" style={{ fontSize: '9px' }}>PUT</span>
                          <span>Sửa</span>
                        </button>

                        {/* API 4: PATCH /api/v1/seller/catalog/products/{id}/category */}
                        <button
                          type="button"
                          className="btn btn-outline-info d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            setSelectedProduct(product);
                            setTargetCategory(categories[0]?.id || '');
                            setChangeCategoryModalOpen(true);
                          }}
                          title="Gán / đổi danh mục (FR-10)"
                        >
                          <span className="nx-api-badge patch" style={{ fontSize: '9px' }}>PATCH</span>
                          <span>Đổi DM</span>
                        </button>

                        {/* API 3: DELETE /api/v1/seller/catalog/products/{id} */}
                        <button
                          type="button"
                          className="btn btn-outline-danger d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            setSelectedProduct(product);
                            setDeleteModalOpen(true);
                          }}
                          title="Xóa mềm sản phẩm (FR-08)"
                        >
                          <span className="nx-api-badge delete" style={{ fontSize: '9px' }}>DEL</span>
                          <span>Xóa</span>
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

      {/* Modal 1: Create Product (POST /api/v1/seller/catalog/products) */}
      <SellerModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tạo sản phẩm thật (POST /api/v1/seller/catalog/products)"
        apiBadge={{ method: 'POST', endpoint: '/api/v1/seller/catalog/products' }}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        submitText="Gửi API Tạo Sản Phẩm (POST)"
      >
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label fw-semibold">Tên sản phẩm (*)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Nhập tên sản phẩm..."
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label fw-semibold">Danh mục (*)</label>
            <select
              className="form-select"
              value={createForm.categoryId}
              onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
              required
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label fw-semibold">Giá cơ bản (VND) (*)</label>
            <input
              type="number"
              className="form-control"
              value={createForm.basePrice}
              onChange={(e) => setCreateForm({ ...createForm, basePrice: Number(e.target.value) })}
              min={1000}
              required
            />
          </div>
          <div>
            <label className="form-label fw-semibold">URL Ảnh sản phẩm (*)</label>
            <input
              type="url"
              className="form-control"
              value={createForm.imageUrl}
              onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label fw-semibold">Mô tả sản phẩm</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Chi tiết về sản phẩm..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            />
          </div>
        </div>
      </SellerModal>

      {/* Modal 2: Edit Product (PUT /api/v1/seller/catalog/products/{id}) */}
      <SellerModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Cập nhật sản phẩm: ${selectedProduct?.name} (FR-07)`}
        apiBadge={{ method: 'PUT', endpoint: `/api/v1/seller/catalog/products/${selectedProduct?.id || '{id}'}` }}
        onSubmit={handleEdit}
        isSubmitting={isSubmitting}
        submitText="Gửi API Cập Nhật (PUT)"
      >
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label fw-semibold">Tên sản phẩm (*)</label>
            <input
              type="text"
              className="form-control"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label fw-semibold">Giá bán (VND) (*)</label>
            <input
              type="number"
              className="form-control"
              value={editForm.basePrice}
              onChange={(e) => setEditForm({ ...editForm, basePrice: Number(e.target.value) })}
              min={1000}
              required
            />
          </div>
          <div>
            <label className="form-label fw-semibold">URL Ảnh</label>
            <input
              type="url"
              className="form-control"
              value={editForm.imageUrl}
              onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label fw-semibold">Mô tả chi tiết</label>
            <textarea
              className="form-control"
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
        </div>
      </SellerModal>

      {/* Modal 3: Change Category (PATCH /api/v1/seller/catalog/products/{id}/category) */}
      <SellerModal
        isOpen={changeCategoryModalOpen}
        onClose={() => setChangeCategoryModalOpen(false)}
        title={`Đổi danh mục: ${selectedProduct?.name} (FR-10)`}
        apiBadge={{ method: 'PATCH', endpoint: `/api/v1/seller/catalog/products/${selectedProduct?.id || '{id}'}/category` }}
        onSubmit={handleChangeCategory}
        isSubmitting={isSubmitting}
        submitText="Gửi API Gán Danh Mục (PATCH)"
      >
        <div>
          <p className="text-muted mb-3">
            Chọn danh mục mới cho sản phẩm <strong>{selectedProduct?.name}</strong>:
          </p>
          <label className="form-label fw-semibold">Danh mục mục tiêu</label>
          <select
            className="form-select"
            value={targetCategory}
            onChange={(e) => setTargetCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </SellerModal>

      {/* Modal 4: Delete Product (DELETE /api/v1/seller/catalog/products/{id}) */}
      <SellerModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Xác nhận xoá mềm sản phẩm (FR-08)"
        apiBadge={{ method: 'DELETE', endpoint: `/api/v1/seller/catalog/products/${selectedProduct?.id || '{id}'}` }}
        onSubmit={handleDelete}
        isSubmitting={isSubmitting}
        submitText="Xác nhận xóa thật (DELETE)"
      >
        <div className="alert alert-warning mb-0">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Bạn có chắc chắn muốn xóa mềm sản phẩm <strong>{selectedProduct?.name}</strong>? Backend sẽ gắn thời gian `deletedAt` và ẩn khỏi danh sách.
        </div>
      </SellerModal>
    </div>
  );
}

export default SellerCatalogPage;
