import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSession } from '../../../services/api/auth';
import {
  messageOf,
  sellerApi,
  type Category,
  type Inventory,
  type Sku,
} from '../../../services/api/seller';
import { notify } from '../../../shared/components/Toast';

interface DraftSkuRow {
  skuCode: string;
  name: string;
  costPrice: string;
  price: string;
  initialQuantity: string;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value) + ' ₫';

const formatPriceRange = (minPrice: number, maxPrice?: number | null) => {
  const min = Number(minPrice) || 0;
  const max = maxPrice !== undefined && maxPrice !== null ? Number(maxPrice) : min;
  if (max > min) {
    return `${formatPrice(min)} – ${formatPrice(max)}`;
  }
  return formatPrice(min);
};

function toFolderSlug(value: string | undefined | null, fallback = 'item'): string {
  const raw = (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return raw || fallback;
}

function flattenCategories(list: Category[], prefix = ''): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [];
  for (const item of list) {
    const label = prefix ? `${prefix} › ${item.name}` : item.name;
    result.push({ id: item.id, label });
    if (item.children?.length) {
      result.push(...flattenCategories(item.children, label));
    }
  }
  return result;
}

async function sha1Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function uploadToCloudinary(file: File, categoryName: string, productName: string): Promise<string> {
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) || 'dzz3kbuuj';
  const apiKey = (import.meta.env.VITE_CLOUDINARY_API_KEY as string | undefined) || '675364625369594';
  const apiSecret =
    (import.meta.env.VITE_CLOUDINARY_API_SECRET as string | undefined) || '1E3Z-HyZ3DwOP8uQF0FAu0jLYN0';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

  const session = getSession();
  const sellerSlug = toFolderSlug(session?.userId || session?.email?.split('@')[0], 'seller');
  const categorySlug = toFolderSlug(categoryName, 'general');
  const productSlug = toFolderSlug(productName, 'product');
  const folder = `nexus/categories/${categorySlug}/sellers/${sellerSlug}/${productSlug}`;

  const form = new FormData();
  form.append('file', file);
  form.append('asset_folder', folder);
  form.append('folder', folder);

  if (uploadPreset) {
    form.append('upload_preset', uploadPreset);
  } else {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await sha1Hex(
      `asset_folder=${folder}&folder=${folder}&timestamp=${timestamp}${apiSecret}`,
    );
    form.append('api_key', apiKey);
    form.append('timestamp', timestamp);
    form.append('signature', signature);
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    throw new Error('Không thể tải ảnh lên Cloudinary.');
  }
  const data = (await res.json()) as { secure_url?: string };
  if (!data?.secure_url) {
    throw new Error('Không nhận được đường dẫn ảnh từ Cloudinary.');
  }
  return data.secure_url;
}

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId?: string }>();
  const isEditMode = Boolean(productId);

  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode);
  const [originalCategoryId, setOriginalCategoryId] = useState('');

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create mode draft SKUs
  const [draftSkus, setDraftSkus] = useState<DraftSkuRow[]>([
    { skuCode: '', name: 'Mặc định', costPrice: '', price: '', initialQuantity: '10' },
  ]);

  // Edit mode existing SKUs & Inventories
  const [existingSkus, setExistingSkus] = useState<Sku[]>([]);
  const [existingInventories, setExistingInventories] = useState<Inventory[]>([]);
  const [qtyEdits, setQtyEdits] = useState<Record<string, string>>({});
  const [costPriceEdits, setCostPriceEdits] = useState<Record<string, string>>({});
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [newDraftSkus, setNewDraftSkus] = useState<DraftSkuRow[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    sellerApi
      .categories(controller.signal)
      .then((tree) => {
        const flat = flattenCategories(tree);
        setCategories(flat);
        if (!isEditMode && flat.length > 0) {
          setCategoryId((prev) => prev || flat[0].id);
        }
      })
      .catch(() => setCategories([]));
    return () => controller.abort();
  }, [isEditMode]);

  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    setLoadingProduct(true);

    const invParams = new URLSearchParams({ productId, page: '0', size: '50' });
    Promise.all([
      sellerApi.product(productId, controller.signal),
      sellerApi.skus(0, controller.signal).catch(() => ({ content: [] as Sku[] })),
      sellerApi.inventories(invParams, controller.signal).catch(() => ({ content: [] as Inventory[] })),
    ])
      .then(([prod, skuPage, invPage]) => {
        setName(prod.name ?? '');
        setDescription(prod.description ?? '');
        setBasePrice(String(prod.basePrice ?? ''));
        setCategoryId(prod.categoryId ?? '');
        setOriginalCategoryId(prod.categoryId ?? '');
        setImageUrls(
          prod.images?.length
            ? prod.images
            : prod.primaryImageUrl
              ? [prod.primaryImageUrl]
              : [],
        );

        const productSkus = (skuPage.content ?? []).filter((s) => s.productId === productId);
        const productInvs = invPage.content ?? [];
        setExistingSkus(productSkus);
        setExistingInventories(productInvs);

        const prices = productSkus
          .map((s) => Number(s.price))
          .filter((p) => Number.isFinite(p) && p > 0);
        if (prices.length > 0) {
          const highest = Math.max(Number(prod.basePrice) || 0, ...prices);
          if (highest > (Number(prod.basePrice) || 0)) {
            setMaxPrice(String(highest));
          }
        }

        const initialQty: Record<string, string> = {};
        for (const inv of productInvs) {
          initialQty[inv.id] = String(inv.availableQuantity);
        }
        setQtyEdits(initialQty);

        const initialCost: Record<string, string> = {};
        const initialSell: Record<string, string> = {};
        for (const sku of productSkus) {
          if (sku.costPrice !== null && sku.costPrice !== undefined) {
            initialCost[sku.id] = String(sku.costPrice);
          }
          if (sku.price !== null && sku.price !== undefined) {
            initialSell[sku.id] = String(sku.price);
          }
        }
        setCostPriceEdits(initialCost);
        setPriceEdits(initialSell);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          notify.error(messageOf(error));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProduct(false);
      });

    return () => controller.abort();
  }, [productId]);

  const numericBase = Number(basePrice) || 0;
  const numericMax = maxPrice.trim() ? Number(maxPrice) || 0 : numericBase;
  const minPriceBound = numericBase > 0 ? numericBase : 0;
  const maxPriceBound = numericMax >= minPriceBound ? numericMax : minPriceBound;

  function isSkuPriceOutOfBounds(rawSkuPrice: string): boolean {
    if (!rawSkuPrice.trim() || minPriceBound <= 0) return false;
    const p = Number(rawSkuPrice);
    if (!Number.isFinite(p)) return true;
    return p < minPriceBound || p > maxPriceBound;
  }

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const remaining = 10 - imageUrls.length;
    if (remaining <= 0) {
      notify.warning('Mỗi sản phẩm chỉ được tải lên tối đa 10 ảnh.');
      event.target.value = '';
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId)?.label ?? '';
    const batch = files.slice(0, remaining);

    setUploadingImage(true);
    try {
      const uploaded = await Promise.all(
        batch.map((file) => uploadToCloudinary(file, selectedCategory, name)),
      );
      setImageUrls((prev) => [...prev, ...uploaded].slice(0, 10));
      notify.success(`Đã tải lên ${uploaded.length} ảnh sản phẩm thành công!`);
    } catch (error) {
      notify.error(messageOf(error));
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  }

  function handleSetPrimaryImage(index: number) {
    setImageUrls((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const chosen = prev[index];
      return [chosen, ...prev.filter((_, idx) => idx !== index)];
    });
  }

  function handleRemoveImage(index: number) {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleAddDraftSkuRow() {
    const setter = isEditMode ? setNewDraftSkus : setDraftSkus;
    setter((prev) => [
      ...prev,
      { skuCode: '', name: '', costPrice: '', price: '', initialQuantity: '10' },
    ]);
  }

  function handleUpdateDraftSkuRow(index: number, field: keyof DraftSkuRow, value: string) {
    const setter = isEditMode ? setNewDraftSkus : setDraftSkus;
    setter((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)),
    );
  }

  function handleRemoveDraftSkuRow(index: number) {
    if (isEditMode) {
      setNewDraftSkus((prev) => prev.filter((_, idx) => idx !== index));
    } else {
      setDraftSkus((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const numericPrice = Number(basePrice);
    const parsedMaxPrice = maxPrice.trim() ? Number(maxPrice) : numericPrice;

    if (!name.trim()) {
      notify.error('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (!categoryId) {
      notify.error('Vui lòng chọn danh mục sản phẩm.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      notify.error('Giá cơ bản phải lớn hơn 0.');
      return;
    }
    if (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < numericPrice) {
      notify.error('Giá cao nhất (nếu nhập) phải lớn hơn hoặc bằng Giá cơ bản.');
      return;
    }
    if (imageUrls.length === 0) {
      notify.error('Vui lòng chọn tải ít nhất 1 ảnh sản phẩm từ máy tính.');
      return;
    }

    if (isEditMode) {
      for (const sku of existingSkus) {
        const rawC = costPriceEdits[sku.id]?.trim();
        const skuCost = rawC ? Number(rawC) : Number(sku.costPrice ?? 0);
        const rawP = priceEdits[sku.id]?.trim();
        const skuPrice = rawP ? Number(rawP) : Number(sku.price ?? numericPrice);
        if (!Number.isFinite(skuPrice) || skuPrice < numericPrice || skuPrice > parsedMaxPrice) {
          notify.error(
            `Giá bán của biến thể SKU "${sku.name || sku.skuCode}" (${formatPrice(skuPrice)}) đang nằm ngoài khoảng giá Product (${formatPriceRange(numericPrice, parsedMaxPrice)}). Vui lòng chỉnh lại!`,
          );
          return;
        }
        if (skuCost > skuPrice) {
          notify.error(
            `Không được phép bán lỗ! Biến thể "${sku.name || sku.skuCode}" đang có Giá gốc (${formatPrice(skuCost)}) cao hơn Giá bán (${formatPrice(skuPrice)}). Vui lòng chỉnh lại!`,
          );
          return;
        }
      }
    }

    const rowsToValidate = isEditMode ? newDraftSkus : draftSkus;
    for (let i = 0; i < rowsToValidate.length; i++) {
      const row = rowsToValidate[i];
      const skuCost = row.costPrice.trim() ? Number(row.costPrice) : null;
      if (skuCost === null || !Number.isFinite(skuCost) || skuCost < 0) {
        notify.error(
          `Vui lòng nhập Giá gốc (giá vốn nhập hàng) cho biến thể "${row.name || `SKU #${i + 1}`}" để tính lời cho Seller!`,
        );
        return;
      }
      const skuPrice = row.price.trim() ? Number(row.price) : numericPrice;
      if (!Number.isFinite(skuPrice) || skuPrice < numericPrice || skuPrice > parsedMaxPrice) {
        notify.error(
          `Giá bán của biến thể "${row.name || `SKU #${i + 1}`}" (${formatPrice(Number(row.price) || 0)}) phải nằm trong khoảng giá Product (${formatPriceRange(numericPrice, parsedMaxPrice)})!`,
        );
        return;
      }
      if (skuCost > skuPrice) {
        notify.error(
          `Không được phép bán lỗ! Biến thể "${row.name || `SKU #${i + 1}`}" có Giá gốc (${formatPrice(skuCost)}) lớn hơn Giá bán (${formatPrice(skuPrice)}). Vui lòng chỉnh lại!`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const imagesPayload = imageUrls.map((imageUrl, idx) => ({ imageUrl, primary: idx === 0 }));

      if (isEditMode && productId) {
        await sellerApi.updateProduct(productId, {
          name: name.trim(),
          description: description.trim(),
          basePrice: numericPrice,
          images: imagesPayload,
        });

        if (categoryId && categoryId !== originalCategoryId) {
          await sellerApi.assignCategory(productId, categoryId);
        }

        // Cập nhật giá gốc, giá bán & tồn kho các SKU hiện có
        await Promise.all(
          existingSkus.map(async (sku) => {
            const rawC = costPriceEdits[sku.id]?.trim();
            const skuCost = rawC ? Number(rawC) : Number(sku.costPrice ?? 0);
            const rawP = priceEdits[sku.id]?.trim();
            const skuPrice = rawP ? Number(rawP) : Number(sku.price ?? numericPrice);
            await sellerApi.updateSku(sku.id, {
              name: sku.name ?? 'Mặc định',
              costPrice: skuCost,
              price: skuPrice,
            });
            const inv = existingInventories.find((i) => i.skuId === sku.id);
            if (inv && qtyEdits[inv.id] !== undefined) {
              const parsedQty = Math.max(0, Math.floor(Number(qtyEdits[inv.id])));
              if (Number.isFinite(parsedQty) && parsedQty !== inv.availableQuantity) {
                await sellerApi.updateInventory(inv.id, 'SET_AVAILABLE', parsedQty).catch(() => null);
              }
            }
          }),
        );

        // Tạo thêm các phân loại SKU mới (nếu có)
        if (newDraftSkus.length > 0) {
          await Promise.all(
            newDraftSkus.map((row, idx) => {
              const skuCost = row.costPrice.trim() ? Number(row.costPrice) : 0;
              const skuPrice = row.price.trim() ? Number(row.price) : numericPrice;
              const qty = Math.max(0, Math.floor(Number(row.initialQuantity) || 0));
              return sellerApi
                .createSku({
                  productId,
                  name: row.name.trim() || `Phân loại ${idx + 1}`,
                  costPrice: Number.isFinite(skuCost) && skuCost >= 0 ? skuCost : 0,
                  price: Number.isFinite(skuPrice) && skuPrice > 0 ? skuPrice : numericPrice,
                  initialTotalQuantity: qty,
                  initialAvailableQuantity: qty,
                })
                .catch(() => null);
            }),
          );
        }

        notify.success('Cập nhật sản phẩm & tồn kho SKU thành công!');
        navigate('/seller/products', { replace: true, state: { listingPublished: true } });
        return;
      }

      // Create mode
      const created = await sellerApi.createProduct({
        name: name.trim(),
        description: description.trim(),
        basePrice: numericPrice,
        categoryId,
        images: imagesPayload,
      });

      await Promise.all(
        draftSkus.map((row, idx) => {
          const skuCost = row.costPrice.trim() ? Number(row.costPrice) : 0;
          const skuPrice = row.price.trim() ? Number(row.price) : numericPrice;
          const qty = Math.max(0, Math.floor(Number(row.initialQuantity) || 0));
          return sellerApi
            .createSku({
              productId: created.id,
              name: row.name.trim() || `Phân loại ${idx + 1}`,
              costPrice: Number.isFinite(skuCost) && skuCost >= 0 ? skuCost : 0,
              price: Number.isFinite(skuPrice) && skuPrice > 0 ? skuPrice : numericPrice,
              initialTotalQuantity: qty,
              initialAvailableQuantity: qty,
            })
            .catch(() => null);
        }),
      );

      notify.success(
        `Đăng bán sản phẩm (${formatPriceRange(numericPrice, parsedMaxPrice)}) & khởi tạo ${draftSkus.length} SKU thành công!`,
      );
      navigate('/seller/products', { replace: true, state: { listingPublished: true } });
    } catch (error) {
      notify.error(messageOf(error));
    } finally {
      setSubmitting(false);
    }
  }

  const inventoryBySkuId = new Map(existingInventories.map((inv) => [inv.skuId, inv]));
  const activeDraftRows = isEditMode ? newDraftSkus : draftSkus;

  return (
    <div className="container py-4" style={{ maxWidth: 1100 }}>
      <div className="col-lg-9 mx-auto mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <Link to="/seller/products" className="text-decoration-none small text-muted d-inline-block mb-1">
            ← Quay lại Sản phẩm & tồn kho
          </Link>
          <h3 className="fw-bold mb-1">
            {isEditMode ? 'Kênh Người Bán — Chỉnh Sửa Sản Phẩm & SKU' : 'Kênh Người Bán — Đăng Bán Sản Phẩm Mới'}
          </h3>
          <p className="text-muted small mb-0">
            {isEditMode
              ? 'Cập nhật đầy đủ thông tin sản phẩm, danh mục, giá niêm yết, hình ảnh và tồn kho SKU'
              : 'Nhập thông tin sản phẩm, giá bán, hình ảnh và khai báo các phân loại SKU ban đầu'}
          </p>
        </div>
      </div>

      <div className="col-lg-9 mx-auto">
        <div className="card shadow-sm border-0 p-4" style={{ borderRadius: 16 }}>
          <h5 className="fw-bold mb-3">
            {isEditMode ? '✏️ Chỉnh sửa sản phẩm & SKU' : '➕ Đăng bán sản phẩm mới'}
          </h5>

          {loadingProduct ? (
            <div className="text-center py-5 text-muted">Đang tải thông tin sản phẩm...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Tên sản phẩm (*)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="VD: Áo khoác Hoodie Nexus / Thẻ bài Pikachu VMAX"
                  maxLength={200}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Danh mục (*)</label>
                <select
                  className="form-select"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 p-3 border rounded-3 bg-light">
                <label className="form-label fw-semibold mb-2 d-block">
                  💰 Giá bán niêm yết của Product (Hiển thị ngoài sàn)
                </label>
                <div className="row g-2 align-items-end">
                  <div className="col-sm-6">
                    <label className="form-label small text-muted mb-1 d-block text-nowrap">
                      Giá cơ bản (VNĐ) (*)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="VD: 250000"
                      min={1000}
                      step="any"
                      required
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small text-muted mb-1 d-block text-nowrap">
                      Giá cao nhất (VNĐ) <span className="text-secondary">(Tuỳ chọn)</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${
                        maxPrice.trim() && Number(maxPrice) < minPriceBound ? 'is-invalid' : ''
                      }`}
                      placeholder="Để trống nếu đồng giá"
                      min={minPriceBound || 1000}
                      step="any"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="small text-muted mt-2">
                  Giá hiển thị trên sàn:{' '}
                  <strong className="text-primary">
                    {minPriceBound > 0
                      ? formatPriceRange(minPriceBound, maxPriceBound)
                      : 'Vui lòng nhập Giá cơ bản'}
                  </strong>
                  <span className="ms-1">
                    {maxPrice.trim() && maxPriceBound > minPriceBound
                      ? '(Giá bán các SKU nằm trong khoảng này)'
                      : '(Đồng giá tất cả phân loại theo Giá cơ bản)'}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Hình ảnh sản phẩm (*){' '}
                  <span className="text-muted fw-normal small">(Tối đa 10 ảnh, lưu vào bảng product_images)</span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  multiple
                  disabled={uploadingImage || imageUrls.length >= 10}
                  onChange={(e) => void handleFileSelect(e)}
                />
                {uploadingImage && (
                  <div className="small text-primary mt-1">Đang tải ảnh sản phẩm lên...</div>
                )}

                {imageUrls.length > 0 && (
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    {imageUrls.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="position-relative border rounded p-1 bg-light text-center"
                        style={{ width: 96 }}
                      >
                        <img
                          src={url}
                          alt={`Ảnh ${idx + 1}`}
                          style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 6 }}
                        />
                        {idx === 0 ? (
                          <span className="badge bg-primary d-block mt-1" style={{ fontSize: 10 }}>
                            Ảnh chính
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 mt-1 text-decoration-none"
                            style={{ fontSize: 11 }}
                            onClick={() => handleSetPrimaryImage(idx)}
                          >
                            Đặt làm chính
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 py-0 px-1"
                          style={{ fontSize: 10, lineHeight: 1.3 }}
                          onClick={() => handleRemoveImage(idx)}
                          title="Xóa ảnh này"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Mô tả chi tiết sản phẩm</label>
                <textarea
                  className="form-control"
                  rows={4}
                  maxLength={5000}
                  placeholder="Mô tả tình trạng sản phẩm, chất liệu, xuất xứ, bảo hành..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Phân loại chi tiết SKU & Tồn kho */}
              <div className="mb-4 p-3 border rounded-3 bg-light">
                <div className="mb-2">
                  <span className="form-label fw-semibold d-block mb-0">
                    🏷️ Phân loại chi tiết SKU & Tồn kho (Bảng <code>skus</code> & <code>inventories</code>)
                  </span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {isEditMode
                      ? 'Danh sách các biến thể hiện có, cập nhật tồn kho hoặc thêm biến thể SKU mới'
                      : 'Khai báo các biến thể (Màu, Size, Giá gốc, Giá bán, Số lượng kho) — Mã SKU hệ thống tự sinh'}
                  </span>
                </div>

                {/* Danh sách SKU hiện có khi ở chế độ Chỉnh sửa */}
                {isEditMode && existingSkus.length > 0 && (
                  <div className="d-flex flex-column gap-2 mt-2 mb-3">
                    {existingSkus.map((sku) => {
                      const inv = inventoryBySkuId.get(sku.id);
                      const rawCost = costPriceEdits[sku.id] ?? (sku.costPrice != null ? String(sku.costPrice) : '');
                      const rawSell = priceEdits[sku.id] ?? (sku.price != null ? String(sku.price) : '');
                      const effSell = rawSell.trim() ? Number(rawSell) : minPriceBound;
                      const effCost = rawCost.trim() ? Number(rawCost) : null;
                      const profit = effCost !== null && effSell > 0 ? effSell - effCost : null;
                      return (
                        <div key={sku.id} className="bg-white p-2 rounded border">
                          <div className="row g-2 align-items-end">
                            <div className="col-sm-4">
                              <label className="form-label mb-1 d-block" style={{ fontSize: 11 }}>
                                Phân loại hiện có
                              </label>
                              <div className="fw-semibold small text-dark">
                                {sku.name || 'Mặc định'}
                              </div>
                              <div className="text-muted font-monospace" style={{ fontSize: 11 }}>
                                {sku.skuCode}
                              </div>
                            </div>
                            <div className="col-sm-3">
                              <label className="form-label mb-1 d-block text-nowrap text-danger fw-semibold" style={{ fontSize: 11 }}>
                                Giá gốc (*)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={effSell > 0 ? effSell : undefined}
                                step="any"
                                className={`form-control form-control-sm ${
                                  profit !== null && profit < 0 ? 'is-invalid' : ''
                                }`}
                                placeholder="Giá vốn nhập"
                                value={rawCost}
                                onChange={(e) =>
                                  setCostPriceEdits((prev) => ({ ...prev, [sku.id]: e.target.value }))
                                }
                              />
                            </div>
                            <div className="col-sm-3">
                              <label className="form-label mb-1 d-block text-nowrap text-primary fw-semibold" style={{ fontSize: 11 }}>
                                Giá bán SKU
                              </label>
                              <input
                                type="number"
                                min={Math.max(minPriceBound || 1000, effCost ?? 0)}
                                max={maxPriceBound >= minPriceBound && maxPriceBound > 0 ? maxPriceBound : undefined}
                                step="any"
                                className={`form-control form-control-sm ${
                                  isSkuPriceOutOfBounds(rawSell) || (profit !== null && profit < 0)
                                    ? 'is-invalid'
                                    : ''
                                }`}
                                placeholder={minPriceBound > 0 ? `Mặc định: ${minPriceBound}` : 'Theo giá cơ bản'}
                                value={rawSell}
                                onChange={(e) =>
                                  setPriceEdits((prev) => ({ ...prev, [sku.id]: e.target.value }))
                                }
                              />
                            </div>
                            <div className="col-sm-2">
                              <label className="form-label mb-1 d-block text-nowrap" style={{ fontSize: 11 }}>
                                Tồn kho (*)
                              </label>
                              {inv ? (
                                <input
                                  type="number"
                                  min={0}
                                  className="form-control form-control-sm"
                                  value={qtyEdits[inv.id] ?? String(inv.availableQuantity)}
                                  onChange={(e) =>
                                    setQtyEdits((prev) => ({ ...prev, [inv.id]: e.target.value }))
                                  }
                                />
                              ) : (
                                <span className="small text-muted">---</span>
                              )}
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1 px-1" style={{ fontSize: 11 }}>
                            {isSkuPriceOutOfBounds(rawSell) ? (
                              <span className="text-danger fw-semibold">
                                ⚠ Giá bán SKU phải nằm trong khoảng {formatPriceRange(minPriceBound, maxPriceBound)}
                              </span>
                            ) : (
                              <span className="text-muted">
                                Giá bán áp dụng:{' '}
                                <strong>{effSell > 0 ? formatPrice(effSell) : '---'}</strong>
                              </span>
                            )}
                            {profit !== null && (
                              <span className={profit >= 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                                {profit >= 0
                                  ? `Lời dự kiến: +${formatPrice(profit)} / SP`
                                  : `⚠ Không được bán lỗ (${formatPrice(profit)} / SP)`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="d-flex flex-column gap-2 mt-2">
                  {activeDraftRows.map((row, idx) => {
                    const effectiveSellPrice = row.price.trim() ? Number(row.price) : minPriceBound;
                    const effectiveCostPrice = row.costPrice.trim() ? Number(row.costPrice) : null;
                    const profitPerUnit =
                      effectiveCostPrice !== null && effectiveSellPrice > 0
                        ? effectiveSellPrice - effectiveCostPrice
                        : null;
                    return (
                      <div key={idx} className="bg-white p-2 rounded border">
                        <div className="row g-2 align-items-end">
                          <div className="col-sm-4">
                            <label className="form-label mb-1 d-block text-nowrap" style={{ fontSize: 11 }}>
                              Phân loại (Màu / Size) (*)
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="VD: Đen - Size L"
                              value={row.name}
                              onChange={(e) => handleUpdateDraftSkuRow(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div className="col-sm-3">
                            <label className="form-label mb-1 d-block text-nowrap text-danger fw-semibold" style={{ fontSize: 11 }}>
                              Giá gốc (*)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={effectiveSellPrice > 0 ? effectiveSellPrice : undefined}
                              step="any"
                              className={`form-control form-control-sm ${
                                profitPerUnit !== null && profitPerUnit < 0 ? 'is-invalid' : ''
                              }`}
                              placeholder="Giá vốn nhập"
                              value={row.costPrice}
                              onChange={(e) => handleUpdateDraftSkuRow(idx, 'costPrice', e.target.value)}
                            />
                          </div>
                          <div className="col-sm-3">
                            <label className="form-label mb-1 d-block text-nowrap text-primary fw-semibold" style={{ fontSize: 11 }}>
                              Giá bán SKU
                            </label>
                            <input
                              type="number"
                              min={Math.max(minPriceBound || 1000, effectiveCostPrice ?? 0)}
                              max={maxPriceBound >= minPriceBound && maxPriceBound > 0 ? maxPriceBound : undefined}
                              step="any"
                              className={`form-control form-control-sm ${
                                isSkuPriceOutOfBounds(row.price) || (profitPerUnit !== null && profitPerUnit < 0)
                                  ? 'is-invalid'
                                  : ''
                              }`}
                              placeholder={minPriceBound > 0 ? `Mặc định: ${minPriceBound}` : 'Theo giá cơ bản'}
                              value={row.price}
                              onChange={(e) => handleUpdateDraftSkuRow(idx, 'price', e.target.value)}
                            />
                          </div>
                          <div className="col-sm-2 d-flex align-items-end gap-1">
                            <div className="flex-grow-1">
                              <label className="form-label mb-1 d-block text-nowrap" style={{ fontSize: 11 }}>
                                Tồn kho (*)
                              </label>
                              <input
                                type="number"
                                min={0}
                                className="form-control form-control-sm"
                                value={row.initialQuantity}
                                onChange={(e) =>
                                  handleUpdateDraftSkuRow(idx, 'initialQuantity', e.target.value)
                                }
                              />
                            </div>
                            {(isEditMode || activeDraftRows.length > 1) && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-0 px-1 mb-1"
                                onClick={() => handleRemoveDraftSkuRow(idx)}
                                title="Xóa dòng SKU này"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-1 px-1" style={{ fontSize: 11 }}>
                          {isSkuPriceOutOfBounds(row.price) ? (
                            <span className="text-danger fw-semibold">
                              ⚠ Giá bán SKU phải nằm trong khoảng {formatPriceRange(minPriceBound, maxPriceBound)}
                            </span>
                          ) : (
                            <span className="text-muted">
                              Giá bán áp dụng:{' '}
                              <strong>{effectiveSellPrice > 0 ? formatPrice(effectiveSellPrice) : '---'}</strong>
                            </span>
                          )}
                          {profitPerUnit !== null && (
                            <span className={profitPerUnit >= 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                              {profitPerUnit >= 0
                                ? `Lời dự kiến: +${formatPrice(profitPerUnit)} / SP`
                                : `⚠ Không được bán lỗ (${formatPrice(profitPerUnit)} / SP)`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary w-100 mt-1 fw-semibold"
                    onClick={handleAddDraftSkuRow}
                  >
                    + Thêm phân loại / biến thể SKU
                  </button>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4"
                  disabled={submitting}
                  onClick={() => navigate('/seller/products')}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-grow-1 rounded-pill fw-semibold py-2"
                  disabled={submitting || uploadingImage}
                >
                  {submitting
                    ? 'Đang xử lý...'
                    : isEditMode
                      ? 'Lưu cập nhật sản phẩm'
                      : 'Đăng bán sản phẩm & Tạo SKU'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
