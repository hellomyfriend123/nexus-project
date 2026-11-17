import { useEffect, useRef } from 'react';
import type { AuctionAction, AuctionResult, AuctionDialogContent } from '../types/auctionResult';
export default function AuctionResultDialog({ action, result, content, onClose, onLoadMore, loading, error }: { action: AuctionAction | null; content: AuctionDialogContent | null; result: AuctionResult; onClose: () => void; onLoadMore: () => void; loading: boolean; error: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (action) dialog.current?.showModal(); else dialog.current?.close(); }, [action]);
  return <dialog ref={dialog} className="nx-ar-dialog" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="nx-ar-dialog-head"><h2>{content?.title}</h2><button onClick={onClose} aria-label="Đóng hộp thoại">×</button></div>
    <p>{content?.description}</p>
    {action === 'bids' && <><ol className="nx-ar-dialog-bids">{result.bids.map(bid => <li key={bid.id}><span>{bid.name}</span><strong>{bid.amount}</strong><small>{bid.time}</small></li>)}</ol>{result.bids.length === 0 && <p>Chưa có lượt trả giá hợp lệ.</p>}{error && <p role="alert">{error}</p>}{result.bidPage + 1 < result.bidTotalPages && <button disabled={loading} onClick={onLoadMore}>{loading ? 'Đang tải…' : 'Tải thêm lịch sử'}</button>}</>}
    <button className="nx-ar-btn nx-ar-btn-primary" onClick={onClose}>Đóng</button>
  </dialog>;
}
