import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getCatalogProduct, getAuction, type CatalogProductDetail, type Auction } from '../../../services/api/catalog';
import { apiErrorMessage } from '../../../services/api/client';
import { notify } from '../../../shared/components/Toast';

export function useProductDetailResource() {
 const { productId } = useParams(); const [params] = useSearchParams(); const auctionId = params.get('auctionId');
 const [product, setProduct] = useState<CatalogProductDetail | null>(null);
 const [auction, setAuction] = useState<Auction | null>(null);
 const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0);
 useEffect(() => { const controller = new AbortController(); setLoading(true); setProduct(null); setAuction(null); setError('');
  if (!productId) { setError('Không tìm thấy sản phẩm.'); setLoading(false); return; }
  Promise.all([getCatalogProduct(productId, controller.signal), auctionId ? getAuction(auctionId, controller.signal) : Promise.resolve(null)]).then(([item, sale]) => {
   if (sale && sale.productId !== item.id) throw new Error('Phiên đấu giá không thuộc sản phẩm này.'); setProduct(item); setAuction(sale);
  }).catch(error => { if (!controller.signal.aborted) { setError(apiErrorMessage(error)); notify.error(apiErrorMessage(error)); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [productId, auctionId, retry]);
 return { product, auction, error, loading, setRetry };
}
