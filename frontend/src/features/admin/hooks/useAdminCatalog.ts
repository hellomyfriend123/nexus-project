import { useState, useEffect, useCallback, useRef } from 'react';
import { adminNotify, adminConfirm } from '../../../roles/administrator/layouts/AdminLayout';
import { adminCatalogApi } from '../services/admin.service';
import { loadAllAdminPages } from '../services/adminPagination';
import type {
  AdminCategory,
  AdminProduct,
  AdminReview,
  ProductStatus,
} from '../types/admin.types';


export function useAdminCatalog() {
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'reviews'>('categories');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  const requestRevision = useRef(0);
  const detailRevision = useRef(0);

  const loadData = useCallback(async () => {
    const revision = ++requestRevision.current;
    const isCurrent = () => revision === requestRevision.current;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'categories') {
        const res = await loadAllAdminPages((pagination) => adminCatalogApi.listCategories({ status: categoryStatusFilter === 'ALL' ? undefined : categoryStatusFilter, ...pagination }), isCurrent);
        if (!isCurrent()) return;
        if (res && Array.isArray(res.content)) {
          setCategories(res.content);
        } else {
          setCategories([]);
        }
      } else if (activeTab === 'products') {
        const categoryPage = await loadAllAdminPages((pagination) => adminCatalogApi.listCategories({  ...pagination }), isCurrent);
        if (!isCurrent()) return;
        setCategories(categoryPage.content);
        const res = await loadAllAdminPages((pagination) => adminCatalogApi.listProducts({ keyword: productKeyword || undefined,
          categoryId: productCategoryFilter === 'ALL' ? undefined : productCategoryFilter, ...pagination }), isCurrent);
        if (!isCurrent()) return;
        if (res && Array.isArray(res.content)) {
          setProducts(res.content);
        } else {
          setProducts([]);
        }
      } else if (activeTab === 'reviews') {
        const res = await loadAllAdminPages((pagination) => adminCatalogApi.listReviews({  ...pagination }), isCurrent);
        if (!isCurrent()) return;
        if (res && Array.isArray(res.content)) {
          setReviews(res.content);
        } else {
          setReviews([]);
        }
      }
    } catch (error) {
      if (!isCurrent()) return;
      setError(error instanceof Error ? error.message : 'Không thể tải dữ liệu.');
      if (activeTab === 'categories') setCategories([]);
      else if (activeTab === 'products') setProducts([]);
      else if (activeTab === 'reviews') setReviews([]);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [activeTab, categoryStatusFilter, productKeyword, productCategoryFilter]);

  useEffect(() => {
    loadData();
    return () => { requestRevision.current += 1; detailRevision.current += 1; };
  }, [loadData]);

  // CATEGORY HANDLERS
  const handleOpenCategoryCreate = () => {
    detailRevision.current += 1;
    setSelectedCategory(null);
    setCategoryForm({ name: '', description: '', status: 'ACTIVE' });
    setShowCategoryModal(true);
  };

  const handleOpenCategoryEdit = async (cat: AdminCategory) => {
    const revision = ++detailRevision.current;
    setSelectedCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || '',
      status: (cat.status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
    });
    setShowCategoryModal(true);
    try {
      const freshCat = await adminCatalogApi.getCategory(cat.id);
      if (revision !== detailRevision.current) return;
      if (freshCat) {
        setSelectedCategory(freshCat);
        setCategoryForm({
          name: freshCat.name,
          description: freshCat.description || '',
          status: (freshCat.status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
        });
      }
    } catch (error) {
      if (revision !== detailRevision.current) return;
      setError(error instanceof Error ? error.message : 'Không thể tải chi tiết.');
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
          sortOrder: selectedCategory.sortOrder,
          parentId: selectedCategory.parentId ?? null,
        });
        adminNotify.success('Đã cập nhật danh mục', categoryForm.name.trim());
      } else {
        await adminCatalogApi.createCategory({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          status: categoryForm.status,
        });
        adminNotify.success('Đã tạo danh mục mới', categoryForm.name.trim());
      }
      setShowCategoryModal(false);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi lưu danh mục từ máy chủ';
      adminNotify.error('Không thể lưu danh mục', errorMsg);
    }
  };

  const handleDeleteCategory = async (cat: AdminCategory) => {
    const ok = await adminConfirm({
      title: 'Xác nhận xoá mềm danh mục',
      message: `Bạn có chắc chắn muốn xoá mềm danh mục "${cat.name}"?\nDanh mục sẽ được chuyển sang trạng thái INACTIVE để đảm bảo toàn vẹn dữ liệu.`,
      confirmLabel: 'Xoá danh mục',
      danger: true,
    });
    if (ok) {
      try {
        await adminCatalogApi.deleteCategory(cat.id);
        adminNotify.success('Đã xoá mềm danh mục', `"${cat.name}" đã chuyển sang INACTIVE`);
        loadData();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
        adminNotify.error('Không thể xoá danh mục', errorMsg);
      }
    }
  };

  // PRODUCT HANDLERS
  const handleToggleProductStatus = async (id: string, currentStatus: ProductStatus) => {
    const nextStatus: ProductStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminCatalogApi.updateProductStatus(id, nextStatus);
      adminNotify.success('Đã đổi trạng thái sản phẩm', `Trạng thái mới: ${nextStatus}`);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      adminNotify.error('Không thể đổi trạng thái sản phẩm', errorMsg);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const ok = await adminConfirm({
      title: 'Xác nhận xoá mềm sản phẩm',
      message: 'Bạn có chắc chắn muốn xoá mềm sản phẩm này?',
      confirmLabel: 'Xoá sản phẩm',
      danger: true,
    });
    if (ok) {
      try {
        await adminCatalogApi.deleteProduct(id);
        adminNotify.success('Đã xoá mềm sản phẩm thành công');
        loadData();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
        adminNotify.error('Không thể xoá sản phẩm', errorMsg);
      }
    }
  };

  // REVIEW HANDLERS
  const handleApproveReview = async (id: string) => {
    try {
      await adminCatalogApi.updateReviewStatus(id, 'VISIBLE');
      adminNotify.success('Đã hiển thị lại đánh giá sản phẩm');
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      adminNotify.error('Không thể hiển thị lại đánh giá', errorMsg);
    }
  };

  const handleRejectReview = async (id: string) => {
    try {
      await adminCatalogApi.updateReviewStatus(id, 'HIDDEN');
      adminNotify.success('Đã ẩn đánh giá sản phẩm');
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      adminNotify.error('Không thể ẩn đánh giá', errorMsg);
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

  return { activeTab, setActiveTab, error, setError, loading, setLoading, categories, setCategories, categoryStatusFilter, setCategoryStatusFilter, selectedCategory, setSelectedCategory, showCategoryModal, setShowCategoryModal, categoryForm, setCategoryForm, products, setProducts, productKeyword, setProductKeyword, productCategoryFilter, setProductCategoryFilter, reviews, setReviews, loadData, handleOpenCategoryCreate, handleOpenCategoryEdit, handleSaveCategory, handleDeleteCategory, handleToggleProductStatus, handleDeleteProduct, handleApproveReview, handleRejectReview, filteredProducts, formatCurrency };
}
