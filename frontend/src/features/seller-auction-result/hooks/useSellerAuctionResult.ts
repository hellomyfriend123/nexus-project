import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSession } from '../../../services/api/auth';
import { apiErrorMessage } from '../../../services/api/client';
import { auctionResultService } from '../services/auctionResultService';
import type { AuctionAction, AuctionResult } from '../types/auctionResult';
export function useSellerAuctionResult() {
  const { auctionId } = useParams();
  const [result, setResult] = useState<AuctionResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [action, setAction] = useState<AuctionAction | null>(null);
  const [checked, setChecked] = useState(false);
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState('');
  const bidController = useRef<AbortController | null>(null);
  const session = getSession();
  const token = session?.accessToken;
  const sellerId = session?.userId;
  useEffect(() => {
    bidController.current?.abort(); setBidLoading(false);
    const controller = new AbortController(); setResult(null); setError(''); setLoading(true); setAction(null); setChecked(false); setBidError('');
    if (!auctionId || !sellerId) { setError('Vui lòng đăng nhập để xem kết quả phiên đấu giá.'); setLoading(false); return () => controller.abort(); }
    auctionResultService.getResult(auctionId, sellerId, controller.signal).then(value => { if (!controller.signal.aborted) setResult(value); }).catch(error => { if (!controller.signal.aborted) setError(apiErrorMessage(error)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); bidController.current?.abort(); };
  }, [auctionId, sellerId, token, retry]);
  const loadMoreBids = async () => {
    if (!result || bidLoading || result.bidPage + 1 >= result.bidTotalPages) return;
    const controller = new AbortController(); bidController.current = controller;
    const current = result; setBidLoading(true); setBidError('');
    try { const page = await auctionResultService.bids(current.id, current.bidPage + 1, controller.signal); if (controller.signal.aborted) return; setResult(latest => latest?.id === current.id ? { ...latest, bids: [...latest.bids, ...page.content.map(bid => auctionResultService.formatBid(bid, latest.winner.username))], bidPage: page.page, bidTotalPages: page.totalPages } : latest); }
    catch (error) { if (!controller.signal.aborted) setBidError(apiErrorMessage(error)); } finally { if (!controller.signal.aborted) setBidLoading(false); }
  };
  return { result, error, loading, retry: () => setRetry(value => value + 1), action, checked, setChecked, openAction: setAction, closeDialog: () => setAction(null), openSupport: () => setAction('support'), bidLoading, bidError, loadMoreBids,
    dialogContent: action ? { title: action === 'bids' ? 'Lịch sử trả giá hợp lệ' : 'Tính năng chưa được hỗ trợ', description: action === 'bids' ? 'Dữ liệu máy chủ, mới nhất trước.' : `${{ shipping: 'Chuẩn bị hàng đóng gói', message: 'Nhắn tin cho người thắng', receipt: 'In biên bản chốt thầu (PDF)', support: 'Liên hệ Nexus', protection: 'Xem chính sách bảo vệ người bán' }[action]} chưa được hỗ trợ. Không có yêu cầu hay thay đổi nào được gửi.` } : null };
}
