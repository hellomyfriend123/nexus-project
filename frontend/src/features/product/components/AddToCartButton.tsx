import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../../../services/api/auth';
import type { CatalogProduct } from '../services/catalog.api';
import { commerceApi } from '../../../services/api/commerce';
import { apiErrorMessage } from '../../../services/api/client';
import { notify } from '../../../shared/components/Toast';

interface AddToCartButtonProps {
  product: CatalogProduct;
  quantity?: number;
  buyNow?: boolean;
  onAdded?: () => void;
  className?: string;
}

export default function AddToCartButton({
  product,
  quantity = 1,
  buyNow = false,
  onAdded,
  className,
}: AddToCartButtonProps) {
  const navigate = useNavigate();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);

  const buttonClass =
    className ?? (buyNow ? 'nx-button nx-button-primary' : 'nx-button nx-button-outline');

  async function handleAction() {
    if (lock.current) return;
    const session = getSession();
    if (!session) {
      notify.info('Vui lòng đăng nhập tài khoản người mua để tiếp tục.');
      navigate('/login');
      return;
    }
    if (!session.roles.includes('BUYER') || session.roles.includes('SELLER') || session.roles.includes('ADMIN')) {
      notify.error('Tài khoản Người bán / Quản trị viên không được phép mua hàng.');
      return;
    }
    if (!Number.isFinite(product.basePrice) || product.basePrice <= 0) {
      notify.warning('Sản phẩm chưa có giá mua hợp lệ.');
      return;
    }

    lock.current = true;
    setPending(true);
    try {
      await commerceApi.add({
        productId: product.id,
        sellerId: product.sellerId,
        productName: product.name,
        quantity,
        unitPrice: product.basePrice,
      });
      window.dispatchEvent(new Event('nexus:cart-changed'));
      if (buyNow) {
        notify.success('Đã thêm vào giỏ hàng.');
        onAdded?.();
        navigate('/cart');
      } else {
        notify.success('Đã thêm sản phẩm vào giỏ hàng.');
        onAdded?.();
      }
    } catch (error) {
      notify.error(apiErrorMessage(error));
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  const disabled =
    pending ||
    product.status !== 'ACTIVE' ||
    product.basePrice <= 0 ||
    !Number.isInteger(quantity) ||
    quantity < 1;

  return (
    <button
      type="button"
      className={buttonClass}
      disabled={disabled}
      onClick={handleAction}
    >
      {pending
        ? buyNow
          ? 'Đang xử lý…'
          : 'Đang thêm…'
        : buyNow
          ? 'Mua ngay'
          : '🛒 Thêm giỏ'}
    </button>
  );
}
