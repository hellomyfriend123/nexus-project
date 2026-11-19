import { useSellerNotifications } from '../hooks/useSellerNotifications';
export default function SellerSidebar() {
  const { sellerNotices, view } = useSellerNotifications();
  const unread = sellerNotices.filter(notice => notice.tone !== 'neutral').length;
  return <aside className="nx-seller-sidebar"><section className="nx-seller-card nx-seller-notices"><h2>Thông báo</h2>{sellerNotices.length === 0 ? <p className="nx-seller-muted">Chưa có thông báo.</p> : <div className="nx-seller-notice-list">{sellerNotices.map(notice => <button type="button" className={`nx-seller-notice nx-seller-notice--${notice.tone}`} key={notice.id} onClick={() => void view(notice.id)}><span className="nx-seller-notice-icon"><i className="bi bi-bell" aria-hidden="true" /></span><span><strong>{notice.title}</strong><span className="nx-seller-notice-body">{notice.body}</span><small>{notice.time}</small></span></button>)}</div>}{unread > 0 && <button type="button" className="nx-seller-all-notices" onClick={() => void view()}>Đánh dấu tất cả đã đọc</button>}</section></aside>;
}
