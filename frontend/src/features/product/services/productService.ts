export const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
