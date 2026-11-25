import { useEffect, useState } from 'react';
import { getAuctionResult } from '../services/auctionResultService';
import type { AuctionResult, Outcome } from '../types/auctionResult';
export function useAuctionResult(auctionId: string, outcome: Outcome) {
  const [result, setResult] = useState<AuctionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  const [subscribed, setSubscribed] = useState(true);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true); setError(''); setResult(null); setNotice('');
      return getAuctionResult(auctionId, outcome, controller.signal);
    }).then(data => {
      if (active && data) { setResult(data); setSeconds(data.summary.paymentSeconds); }
    }).catch(error => { if (active) setError(error instanceof Error ? error.message : 'Không tải được kết quả. Vui lòng thử lại.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [auctionId, outcome, revision]);
  useEffect(() => {
    if (!result || outcome !== 'winner' || result.summary.paymentSeconds <= 0) return;
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [result, outcome]);
  const mockAction = (label: string) => setNotice(`${label}: chưa được hỗ trợ bởi API hiện tại. Không có giao dịch được thực hiện.`);
  return { result, loading, error, seconds, notice, subscribed, setSubscribed, mockAction,
    dismissNotice: () => setNotice(''), retry: () => setRevision(value => value + 1) };
}
