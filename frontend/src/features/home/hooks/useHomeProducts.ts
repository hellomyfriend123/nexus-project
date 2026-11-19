import { useEffect, useState } from 'react';
import type { Listing } from '../../../services/api/catalog';
import { loadHomeProducts } from '../services/homeProducts';
import { AUCTION_REFRESH_MS } from '../../../services/api/discovery';
import { apiErrorMessage } from '../../../services/api/client';
import { getSession } from '../../../services/api/auth';
import { notify } from '../../../shared/components/Toast';
export function useHomeProducts(auction = false) {
 const [sessionKey, setSessionKey] = useState(() => getSession()?.accessToken ?? '');
 useEffect(() => { const changed = () => setSessionKey(getSession()?.accessToken ?? ''); window.addEventListener('nexus:session-changed', changed); window.addEventListener('storage', changed); return () => { window.removeEventListener('nexus:session-changed', changed); window.removeEventListener('storage', changed); }; }, []);
 const [products, setProducts] = useState<Listing[]>([]);
 const [loading, setLoading] = useState(true); const [error, setError] = useState('');
 useEffect(() => {
  let controller: AbortController | undefined; let disposed = false;
  setLoading(true); setProducts([]); setError('');
  if (auction && !sessionKey) { setLoading(false); setError('Đăng nhập để xem các phiên đấu giá.'); return; }
  async function load(background = false) {
   if (disposed || (background && controller && !controller.signal.aborted)) return;
   const current = new AbortController(); controller = current;
   try {
    const result = await loadHomeProducts(auction, current.signal);
    if (!disposed && !current.signal.aborted) {
     setProducts(result); setError('');
    }
   } catch (error) { if (!disposed && !current.signal.aborted) { setError(apiErrorMessage(error)); if (!background) notify.error(apiErrorMessage(error)); } }
   finally { if (!disposed && !current.signal.aborted) setLoading(false); if (controller === current) controller = undefined; }
  }
  void load();
  const refresh = () => { if (document.visibilityState !== 'hidden') void load(true); };
  const timer = auction ? window.setInterval(refresh, AUCTION_REFRESH_MS) : undefined;
  if (auction) window.addEventListener('focus', refresh);
  return () => { disposed = true; controller?.abort(); if (timer !== undefined) window.clearInterval(timer); window.removeEventListener('focus', refresh); };
 }, [auction, sessionKey]);
 return { products, loading, error, requiresLogin: auction && !sessionKey };
}
