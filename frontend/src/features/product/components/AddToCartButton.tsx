import { getSession } from '../../../services/api/auth';
import { useRef, useState } from 'react';
import type { CatalogProduct } from '../services/catalog.api';
import { commerceApi } from '../../../services/api/commerce';
import { apiErrorMessage } from '../../../services/api/client';
import { notify } from '../../../shared/components/Toast';
export default function AddToCartButton({ product, quantity = 1, onAdded, className = "nx-button nx-button-primary" }: { product: CatalogProduct; quantity?: number; onAdded?: () => void; className?: string }) {
 const lock = useRef(false);
 const [pending, setPending] = useState(false);
 async function add() { if (lock.current) return;
 const session = getSession();
 if (!session) { notify.info('Vui lòng đăng nhập tài khoản người mua để thêm vào giỏ hàng.'); return; }
 if (!session.roles.includes('BUYER')) { notify.error('Chỉ tài khoản có vai trò người mua mới được sử dụng giỏ hàng.'); return; }
 if (!Number.isFinite(product.basePrice) || product.basePrice <= 0) { notify.warning('Sản phẩm chưa có giá mua hợp lệ.'); return; }
 // TODO Catalog does not expose SKU selection or stock; do not synthesize a skuId.
 lock.current = true; setPending(true);
 try { await commerceApi.add({ productId: product.id, sellerId: product.sellerId, productName: product.name, quantity, unitPrice: product.basePrice });
 window.dispatchEvent(new Event('nexus:cart-changed')); notify.success('Đã thêm sản phẩm vào giỏ hàng.'); onAdded?.();
 } catch (error) { notify.error(apiErrorMessage(error)); } finally { lock.current = false; setPending(false); }
 }
 return <button className={className} disabled={pending || product.status !== 'ACTIVE' || product.basePrice <= 0 || !Number.isInteger(quantity) || quantity < 1} onClick={add}>{pending ? 'Đang thêm…' : '🛒 Thêm giỏ'}</button>;
}
