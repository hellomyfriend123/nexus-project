import { useEffect, useState } from 'react';
import { getAuctionResult } from '../services/auctionResultService';
import type { AuctionResult, Outcome } from '../types/auctionResult';
export function useAuctionResult(auctionId: string, outcome: Outcome) {
  const [result, setResult] = useState<AuctionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true); setError(''); setResult(null);
    getAuctionResult(auctionId, outcome, controller.signal).then(data => { if (active) setResult(data); })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : 'Không tải được kết quả. Vui lòng thử lại.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [auctionId, outcome, revision]);
  return { result, loading, error, retry: () => setRevision(value => value + 1) };
}

