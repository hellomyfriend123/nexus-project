// Implemented static destinations only. Protected pages retain their existing route guards.
export const recoveryRoutes = [
  { path: '/', label: 'Trang chủ' },
  { path: '/login', label: 'Đăng nhập' },
  { path: '/register', label: 'Đăng ký' },
  { path: '/categories', label: 'Danh mục sản phẩm' },
  { path: '/products', label: 'Danh sách sản phẩm' },
  { path: '/cart', label: 'Giỏ hàng & Thanh toán' },
  { path: '/buyer-hub', label: 'Trung tâm người mua' },
  { path: '/seller-hub', label: 'Trung tâm người bán' },
  { path: '/seller/products', label: 'Quản lý sản phẩm & Tồn kho' },
  { path: '/seller/products/new', label: 'Đăng bán sản phẩm mới' },
  { path: '/seller/orders/success', label: 'Đơn bán hàng — cần chọn đơn' },
  { path: '/seller/auctions/new', label: 'Tạo phiên đấu giá mới' },
  { path: '/admin', label: 'Tổng quan quản trị — cần quyền Admin' },
  { path: '/admin/users', label: 'Quản lý người dùng — cần quyền Admin' },
  { path: '/admin/catalog', label: 'Quản lý danh mục & Sản phẩm — cần quyền Admin' },
  { path: '/admin/commerce', label: 'Quản lý đơn hàng & Khuyến mãi — cần quyền Admin' },
  { path: '/admin/fulfillment', label: 'Quản lý kho & Tồn kho — cần quyền Admin' },
  { path: '/admin/auctions', label: 'Quản lý đấu giá — cần quyền Admin' },
] as const;

export function editDistance(left: string, right: string): number {
  let row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    const next = [i];
    for (let j = 1; j <= right.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[right.length];
}

export function getRecoverySuggestions(pathname: string) {
  const normalized = pathname.toLowerCase();
  return recoveryRoutes.map(route => {
    const distance = editDistance(normalized, route.path);
    return { ...route, distance, match: 1 - distance / Math.max(normalized.length, route.path.length, 1) };
  }).sort((a, b) => a.distance - b.distance || a.path.localeCompare(b.path));
}
