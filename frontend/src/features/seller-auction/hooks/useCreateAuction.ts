import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiError } from '../../../services/api/client';
import { getSession } from '../../../services/api/auth';
import { messageOf, type Auction } from '../../../services/api/seller';
import { createAuction, createAuctionDraft, getAuctionProducts } from '../services/auctionService';
import type { AuctionDraft, AuctionProduct } from '../types/createAuction';
import { getAuctionEndDate } from '../utils/auctionFormatting';
import { validateAuction } from '../utils/auctionValidation';
export interface CreateAuctionOptions {
  /** Preselected product, used when the dialog is opened from an inventory row. */
  initialProductId?: string | null;
  /** Called once the auction has been created successfully. */
  onSuccess?: (auction: Auction) => void;
}
export function useCreateAuction(options: CreateAuctionOptions = {}) {
  const [params] = useSearchParams();
  // The URL is the fallback so direct visits to /seller/auctions/new?productId=… still preselect.
  const requestedProductId = options.initialProductId ?? params.get('productId');
  const onSuccess = useRef(options.onSuccess);
  onSuccess.current = options.onSuccess;
  const [products, setProducts] = useState<AuctionProduct[]>([]);
  const [draft, setDraft] = useState(createAuctionDraft);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Auction | null>(null);
  const [preview, setPreview] = useState(false);
  const lock = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  const sessionKey = () => { const session = getSession(); return session?.roles.includes('SELLER') ? session.userId + ':' + session.accessToken : ''; };
  const identity = useRef(sessionKey());
  const revision = useRef(0);
  useEffect(() => {
    const changed = () => {
      const key = sessionKey();
      if (key === identity.current) return;
      identity.current = key; revision.current++; lock.current = false;
      setProducts([]); setDraft(createAuctionDraft()); setErrors([]); setCreated(null);
      setBusy(false); setUncertain(false); setLoading(true); setLoadError(''); setReload(value => value + 1);
    };
    window.addEventListener('nexus:session-changed', changed);
    window.addEventListener('storage', changed);
    return () => { window.removeEventListener('nexus:session-changed', changed); window.removeEventListener('storage', changed); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const session = getSession();
    const sellerId = session?.roles.includes('SELLER') ? session.userId : undefined;
    const key = sessionKey();
    Promise.resolve().then(() => {
      if (!sellerId) throw new Error('Vui lòng đăng nhập tài khoản người bán.');
      return getAuctionProducts(sellerId, controller.signal);
    }).then(rows => {
      if (!controller.signal.aborted && key === sessionKey()) {
        setProducts(rows);
        if (requestedProductId && rows.some(row => row.id === requestedProductId)) setDraft(previous => previous.productId ? previous : { ...previous, productId: requestedProductId });
      }
    }).catch(error => { if (!controller.signal.aborted && key === sessionKey()) setLoadError(messageOf(error)); })
      .finally(() => { if (!controller.signal.aborted && key === sessionKey()) setLoading(false); });
    return () => controller.abort();
  }, [reload, requestedProductId]);
  const product = products.find(item => item.id === draft.productId);
  function update<K extends keyof AuctionDraft>(key: K, value: AuctionDraft[K]) {
    if (!lock.current && !created && !uncertain) setDraft(previous => ({ ...previous, [key]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || created || uncertain || loading || loadError) return;
    if (!sessionKey() || sessionKey() !== identity.current) {
      setErrors(['Phiên đăng nhập đã thay đổi hoặc hết hạn. Vui lòng đăng nhập người bán và tải lại trang.']); return;
    }
    const nextErrors = validateAuction(draft);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    lock.current = true; setBusy(true);
    const attempt = revision.current;
    const key = sessionKey();
    const current = () => attempt === revision.current && key === sessionKey();
    try { const auction = await createAuction(draft, products); if (current()) { setCreated(auction); onSuccess.current?.(auction); } }
    catch (error) {
      if (current()) {
        const unknownOutcome = !(error instanceof ApiError) || error.status < 400 || error.status >= 500 || error.status === 408;
        setUncertain(unknownOutcome);
        setErrors([unknownOutcome ? 'Chưa xác nhận được kết quả tạo phiên. Kiểm tra danh sách phiên trong Seller Hub trước khi tạo lại để tránh trùng lặp. ' + messageOf(error) : messageOf(error)]);
      }
    }
    finally { if (attempt === revision.current) { lock.current = false; setBusy(false); } }
  }
  function togglePreview() {
    setPreview(value => !value);
    document.getElementById('sca-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return { products, draft, errors, loading, loadError, busy, created, uncertain, preview, product,
    endDate: getAuctionEndDate(draft), update, selectProduct: (id: string) => update('productId', id), submit,
    togglePreview, retry: () => { setLoading(true); setLoadError(''); setReload(value => value + 1); },
    focusProduct: () => document.getElementById('sca-product')?.focus() };
}
export type CreateAuctionState = ReturnType<typeof useCreateAuction>;
