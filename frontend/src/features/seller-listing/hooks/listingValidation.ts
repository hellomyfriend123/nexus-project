import type { ListingDraftForm } from '../types/createListing';
export function validateListing(draft: ListingDraftForm, category: string, saleModes: string[]) {
  const TITLE_MAX = 120;
  const next: string[] = [];
    if (!draft.title.trim() || draft.title.length > TITLE_MAX) next.push('Tên sản phẩm bắt buộc, tối đa 120 ký tự.');
    if (!draft.description.trim()) next.push('Vui lòng nhập mô tả sản phẩm.');
    if (draft.description.trim().length > 5000) next.push('Mô tả HTML tối đa 5000 ký tự.');
    if (!category) next.push('Vui lòng chọn danh mục.');
    if (!Number.isFinite(draft.price) || draft.price <= 0) next.push('Giá bán phải là số dương.');
    else if (!/^\d+(\.\d{1,2})?$/.test(String(draft.price))) next.push('Giá bán tối đa 2 chữ số thập phân.');
    else if (!Number.isSafeInteger(Math.round(draft.price * 100))) next.push('Giá bán vượt giới hạn xử lý chính xác của giao diện.');
    if (!Number.isInteger(draft.quantity) || draft.quantity <= 0 || draft.quantity > 99) next.push('Số lượng phải là số nguyên từ 1 đến 99.');
    if (!saleModes.length) next.push('Chọn ít nhất một phương thức bán.');
    if (saleModes.includes('auction')) next.push('Tạo đấu giá trong màn hình này chưa được hỗ trợ. Bỏ chọn đấu giá để đăng bán.');

    if (saleModes.includes('offer')) next.push('Trả giá chưa được hỗ trợ.');

  return next;
}
