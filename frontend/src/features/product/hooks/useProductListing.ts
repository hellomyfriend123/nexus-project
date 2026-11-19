import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { type Listing } from '../../../services/api/catalog';
import { getSession } from '../../../services/api/auth';
import { listDiscoveryProducts, AUCTION_REFRESH_MS } from '../../../services/api/discovery';
import { apiErrorMessage } from '../../../services/api/client';
import { notify } from '../../../shared/components/Toast';

export const PAGE_SIZE = 24;
const budgetLabels: Record<string, string> = {
  under5: 'Dưới 5 triệu',
  '5to20': '5 triệu – 20 triệu',
  over20: 'Trên 20 triệu',
};

export function useProductListing() {
  const { categoryId: routeCategoryId = 'all' } = useParams();
  const [params, setParams] = useSearchParams();
  const categoryId = routeCategoryId !== 'all' ? routeCategoryId : params.get('categoryId') || 'all';
  const requestedMode = params.get('mode');
  const mode =
    requestedMode === 'auction' || requestedMode === 'buy-now'
      ? requestedMode
      : 'buy-now';
  const query = params.get('q') ?? '';
  function setQuery(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next);
  }
  const [sort, setSort] = useState('featured');
  const [budget, setBudget] = useState('all');
  const [pagination, setPagination] = useState({ key: '', page: 1 });
  function setMode(value: string) {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('mode'); else next.set('mode', value);
    setParams(next);
  }
  function resetFilters() {
    const next = new URLSearchParams(params); next.delete('q'); next.delete('mode');
    setParams(next); setSort('featured'); setBudget('all');
  }
  const resultKey = JSON.stringify(mode === 'auction' ? [mode] : [categoryId, mode, query, budget, sort]);
  const page = pagination.key === resultKey ? pagination.page : 1;
  const [products, setProducts] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [sessionKey, setSessionKey] = useState(() => getSession()?.accessToken ?? '');
  useEffect(() => {
    const changed = () => setSessionKey(getSession()?.accessToken ?? '');
    window.addEventListener('nexus:session-changed', changed); window.addEventListener('storage', changed);
    return () => { window.removeEventListener('nexus:session-changed', changed); window.removeEventListener('storage', changed); };
  }, []);
  useEffect(() => {
    let disposed = false; let controller: AbortController | undefined;
    setLoading(true); setError(''); setProducts([]); setTotal(0); setPageCount(0);
    async function load(background = false) {
      if (disposed || (background && controller)) return;
      const current = new AbortController(); controller = current;
      const sortValue = sort === 'price-low' ? 'basePrice,asc' : sort === 'price-high' ? 'basePrice,desc' : 'createdAt,desc';
      try {
        const result = await listDiscoveryProducts(mode === 'auction' ? { mode, page: page - 1, size: PAGE_SIZE } : { mode, keyword: query.trim(), categoryId: categoryId === 'all' ? undefined : categoryId,
          status: 'ACTIVE', page: page - 1, size: PAGE_SIZE, sort: sortValue,
          minPrice: budget === '5to20' ? 5000000 : budget === 'over20' ? 20000001 : undefined,
          maxPrice: budget === 'under5' ? 4999999 : budget === '5to20' ? 20000000 : undefined }, current.signal);
        if (!disposed && !current.signal.aborted) {
          setProducts(result.content); setTotal(result.totalElements); setPageCount(result.totalPages); setError('');
        }
      } catch (error) {
        if (!disposed && !current.signal.aborted) { setError(apiErrorMessage(error)); if (!background) notify.error(apiErrorMessage(error)); }
      } finally {
        if (!disposed && !current.signal.aborted) setLoading(false);
        if (controller === current) controller = undefined;
      }
    }
    void load();
    const refresh = () => { if (document.visibilityState !== 'hidden') void load(true); };
    const autoRefresh = mode === 'auction' && Boolean(sessionKey);
    const timer = autoRefresh ? window.setInterval(refresh, AUCTION_REFRESH_MS) : undefined;
    if (autoRefresh) window.addEventListener('focus', refresh);
    return () => { disposed = true; controller?.abort(); if (timer !== undefined) window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [categoryId, mode, query, budget, sort, page, retry, sessionKey]);
  const start = (page - 1) * PAGE_SIZE;
  const pageProducts = products;
  const selectSort = setSort;

  const activeFilters = mode === 'auction' ? [] : [
    ...(query ? [{ label: `Tìm: ${query}`, clear: () => setQuery('') }] : []),
    ...(budget !== 'all'
      ? [{ label: budgetLabels[budget], clear: () => setBudget('all') }]
      : []),
  ];


    return { categoryId, mode, query, setQuery, sort, budget, setBudget, setMode, resetFilters, resultKey, page, products, total, pageCount, loading, error, setRetry, start, pageProducts, selectSort, activeFilters, setPagination };
}

