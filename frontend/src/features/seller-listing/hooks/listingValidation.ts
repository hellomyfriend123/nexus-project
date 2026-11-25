import type { ListingDraftForm } from '../types/createListing';
export function validateListing(draft: ListingDraftForm, category: string, saleModes: string[]) {
  const TITLE_MAX = 120;
  const next: string[] = [];
    if (!draft.title.trim() || draft.title.length > TITLE_MAX) next.push('Tên sản phẩm bắt buộc, tối đa 120 ký tự.');
    if (!draft.description.trim()) next.push('Vui lòng nhập mô tả sản phẩm.');
    if (draft.description.trim().length > 5000) next.push('Mô tả HTML tối đa 5000 ký tự.');
    if (!category) next.push('Vui lòng chọn danh mục.');
    if (!Number.isFinite(draft.price) || draft.price <= 0) next.push('Giá niêm yết phải là số dương.');
    if (!Number.isInteger(draft.quantity) || draft.quantity <= 0 || draft.quantity > 99) next.push('Số lượng phải là số nguyên từ 1 đến 99.');
    if (!saleModes.length) next.push('Chọn ít nhất một phương thức bán.');
    if (saleModes.includes('auction')) next.push('Đấu giá chưa hỗ trợ trong màn hình này. Bỏ chọn đấu giá để đăng bán.');
    if (saleModes.includes('fixed') && (!Number.isFinite(draft.dealPrice) || draft.dealPrice <= 0 || draft.dealPrice > draft.price)) next.push('Giá ưu đãi phải lớn hơn 0 và không vượt giá niêm yết.');
    if (saleModes.includes('offer') && (!Number.isFinite(draft.minOffer) || draft.minOffer <= 0 || draft.minOffer > (saleModes.includes('fixed') ? draft.dealPrice : draft.price))) next.push('Ngưỡng trả giá phải lớn hơn 0 và không vượt giá bán.');

  return next;
}
