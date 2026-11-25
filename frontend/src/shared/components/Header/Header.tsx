import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getSession, logout, me } from '../../../services/api/auth';
import type { LoginResponse } from '../../../features/auth/types/auth';
import { notify } from '../Toast';
import { headerApi, type HeaderCategory, type HeaderNotification } from '../../../services/api/header';
import { apiErrorMessage } from '../../../services/api/client';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLElement>(null);
  const notificationButton = useRef<HTMLButtonElement>(null);
  const categoryButton = useRef<HTMLButtonElement>(null);
  const [session, setSession] = useState<LoginResponse | null>(() => getSession());
  const [categories, setCategories] = useState<HeaderCategory[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [notificationError, setNotificationError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<'categories' | 'notifications' | null>(null);
  const [marking, setMarking] = useState(false);
  const accountPath = session?.roles.includes('ADMIN') ? '/admin' : session?.roles.includes('SELLER') ? '/seller-hub' : '/buyer-hub';

  useEffect(() => {
    const controller = new AbortController();
    headerApi.categories(controller.signal).then(rows => {
      if (!controller.signal.aborted) setCategories(rows);
    }).catch(error => {
      if (!controller.signal.aborted) setCategoryError(apiErrorMessage(error));
    }).finally(() => { if (!controller.signal.aborted) setCategoriesLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let controller: AbortController | undefined;
    let cartController: AbortController | undefined;
    const loadCart = () => {
      cartController?.abort();
      const current = getSession();
      if (!current?.roles.includes('BUYER')) { setCartCount(null); return; }
      cartController = new AbortController();
      const signal = cartController.signal;
      headerApi.cartCount(signal).then(count => {
        if (!signal.aborted && getSession()?.accessToken === current.accessToken) {
          setCartCount(count);
        }
      }).catch(() => { if (!signal.aborted) setCartCount(null); });
    };
    const load = () => {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      const current = getSession();
      setSession(current); setOpen(null); setCartCount(null); setNotifications([]); setUnreadCount(0); setNotificationError('');
      loadCart();
      if (!current) return;
      const accept = <T,>(callback: (value: T) => void) => (value: T) => {
        if (!signal.aborted && getSession()?.accessToken === current.accessToken) callback(value);
      };
      me(signal).then(accept(profile => setSession(latest => latest ? { ...latest, ...profile } : null))).catch(() => {});
      Promise.all([headerApi.notifications(signal), headerApi.unreadCount(signal)]).then(accept(([page, count]) => {
        setNotifications(page.content); setUnreadCount(count);
      })).catch(error => { if (!signal.aborted) setNotificationError(apiErrorMessage(error)); });
    };
    load();
    window.addEventListener('nexus:cart-changed', loadCart);
    window.addEventListener('nexus:session-changed', load);
    window.addEventListener('storage', load);
    return () => {
      controller?.abort(); cartController?.abort();
      window.removeEventListener('nexus:cart-changed', loadCart);
      window.removeEventListener('nexus:session-changed', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => {
      setSession(getSession()); setCartCount(null); setNotifications([]); setUnreadCount(0); setOpen(null);
    }, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session]);

  useEffect(() => {
    const outside = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(null); };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (open === 'notifications') notificationButton.current?.focus();
      if (open === 'categories') categoryButton.current?.focus();
      setOpen(null);
    };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setOpen(null);
    const params = new URLSearchParams({ mode: 'buy-now' });
    if (search.trim()) params.set('q', search.trim());
    navigate('/products?' + params);
  }
  async function signOut() {
    setSession(null); setCartCount(null); setNotifications([]); setUnreadCount(0); setOpen(null);
    try { await logout(); } catch { notify.info('Đã đăng xuất trên thiết bị này.'); }
    navigate('/login');
  }
  async function markAllRead() {
    const token = getSession()?.accessToken;
    if (!token || marking) return;
    setMarking(true);
    try {
      await headerApi.readAll();
      if (getSession()?.accessToken === token) { setUnreadCount(0); setNotifications(rows => rows.map(row => ({ ...row, read: true }))); }
    } catch (error) { if (getSession()?.accessToken === token) notify.error(apiErrorMessage(error)); }
    finally { setMarking(false); }
  }
  async function readNotification(item: HeaderNotification) {
    const token = getSession()?.accessToken;
    if (!token) return;
    try {
      const detail = await headerApi.notification(item.id);
      if (getSession()?.accessToken !== token) return;
      await headerApi.read(item.id);
      if (getSession()?.accessToken !== token) return;
      notify.info(detail.content || detail.title);
      setNotifications(rows => rows.map(row => row.id === item.id ? { ...row, read: true } : row));
      const count = await headerApi.unreadCount();
      if (getSession()?.accessToken === token) setUnreadCount(count);
    } catch (error) { if (getSession()?.accessToken === token) notify.error(apiErrorMessage(error)); }
  }

  return <header className="nexus-header" ref={rootRef}>
    <div className="nexus-header-container">
      <div className="nexus-main-bar">
        <Link to="/" className="nexus-wordmark" aria-label="Nexus — Trang chủ">nexus<span aria-hidden="true">.</span></Link>
        <form className="nexus-search" role="search" onSubmit={submitSearch}>
          <i className="bi bi-search" aria-hidden="true" />
          <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm sản phẩm bạn quan tâm" aria-label="Tìm sản phẩm" />
          <button type="submit">Tìm kiếm</button>
        </form>
        <div className="nexus-header-actions">
          {session && <div className="nexus-popover-anchor">
            <button ref={notificationButton} className="nexus-icon-button" type="button" aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`} aria-expanded={open === 'notifications'} aria-controls="header-notifications" onClick={() => setOpen(open === 'notifications' ? null : 'notifications')}>
              <i className="bi bi-bell" aria-hidden="true" />{unreadCount > 0 && <span className="nexus-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>
            {open === 'notifications' && <section id="header-notifications" className="nexus-popover nexus-notifications" aria-label="Thông báo">
              <div className="nexus-popover-heading"><strong>Thông báo</strong><button type="button" disabled={marking || unreadCount === 0} onClick={markAllRead}>Đọc tất cả</button></div>
              {notificationError ? <p role="alert">{notificationError}</p> : notifications.length ? notifications.map(item => <button type="button" key={item.id} className={`nexus-notification${item.read ? '' : ' is-unread'}`} onClick={() => void readNotification(item)}>
                <strong>{item.title}</strong><span>{item.content || 'Xem thông báo'}</span><small>{new Date(item.createdAt).toLocaleString('vi-VN')}</small>
              </button>) : <p>Chưa có thông báo.</p>}
            </section>}
          </div>}
          {(!session || session.roles.includes('BUYER')) && <Link to="/cart" className="nexus-icon-button" aria-label={`Giỏ hàng${cartCount !== null ? `, ${cartCount} sản phẩm` : ''}`}><i className="bi bi-bag" aria-hidden="true" />{cartCount !== null && cartCount > 0 && <span className="nexus-count">{cartCount > 99 ? '99+' : cartCount}</span>}</Link>}
          <Link to={session ? accountPath : '/login'} className="nexus-account" aria-label={session ? 'Tài khoản của tôi' : 'Đăng nhập'}><i className="bi bi-person-circle" aria-hidden="true" /><span>{session ? 'Tài khoản' : 'Đăng nhập'}</span></Link>
        </div>
      </div>
      <nav className="nexus-navigation" aria-label="Điều hướng chính">
        <div className="nexus-popover-anchor">
          <button ref={categoryButton} type="button" className="nexus-category-button" aria-expanded={open === 'categories'} aria-controls="header-categories" onClick={() => setOpen(open === 'categories' ? null : 'categories')}><i className="bi bi-grid" aria-hidden="true" /> Danh mục <i className="bi bi-chevron-down" aria-hidden="true" /></button>
          {open === 'categories' && <div id="header-categories" className="nexus-popover nexus-categories">
            <Link to="/products?mode=buy-now" onClick={() => setOpen(null)}>Tất cả sản phẩm</Link>
            {categoriesLoading ? <p role="status">Đang tải danh mục…</p> : categoryError ? <p role="alert">{categoryError}</p> : categories.map(category => <Link key={category.id} to={`/categories/${category.id}?mode=buy-now`} onClick={() => setOpen(null)}>{category.name}</Link>)}
          </div>}
        </div>
        {!session?.roles.includes('SELLER') && !session?.roles.includes('ADMIN') && (
          <>
            <Link to="/products?mode=buy-now" onClick={() => setOpen(null)}>Mua ngay</Link>
            <Link to="/products?mode=auction" onClick={() => setOpen(null)}>Đấu giá</Link>
          </>
        )}
        <div className="nexus-navigation-end">
          {session?.roles.includes('SELLER') ? <NavLink to="/seller-hub">Kênh người bán <span aria-hidden="true">↗</span></NavLink> : !session && <Link to="/register">Đăng ký</Link>}
          {session && <button type="button" onClick={() => void signOut()}>Đăng xuất</button>}
        </div>
      </nav>
    </div>
  </header>;
}
