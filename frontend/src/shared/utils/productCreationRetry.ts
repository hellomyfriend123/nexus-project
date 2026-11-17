import type { ProductInput } from '../../services/api/seller';

type ProductCreationInput = ProductInput & { categoryId: string };
export interface PendingProductCreation { id: string; fingerprint: string }

// Snapshot only persisted product fields; SKU code and stock may change on retry.
export function productCreationFingerprint(input: ProductCreationInput): string {
  return JSON.stringify({ name: input.name, description: input.description, basePrice: input.basePrice, categoryId: input.categoryId, images: input.images });
}

export function assertProductRetryMatches(pending: PendingProductCreation | null, input: ProductCreationInput): void {
  if (pending && pending.fingerprint !== productCreationFingerprint(input)) {
    throw new Error('Sản phẩm đã được tạo với thông tin trước đó. Hãy khôi phục tên, mô tả, giá và danh mục như lần tạo trước rồi thử lại; chỉ sửa mã SKU hoặc số lượng để hoàn tất tồn kho.');
  }
}
