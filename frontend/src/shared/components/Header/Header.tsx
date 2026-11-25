import { useState, useRef, useEffect } from 'react';
import type { FormEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSession, logout, me } from '../../../services/api/auth';
import type { LoginResponse } from '../../../features/auth/types/auth';
import NexusLogo from '../Logo/NexusLogo';
import { notify } from '../Toast';
import { headerApi, type HeaderCategory, type HeaderNotification } from '../../../services/api/header';
import { apiErrorMessage } from '../../../services/api/client';
import './Header.css';

type HeaderCartLine = Awaited<ReturnType<typeof headerApi.cart>>['items'][number];
interface SubNavItem { label: string; href: string; isHighlight?: boolean }

function Header() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<HeaderCartLine[]>([]);
  const [categories, setCategories] = useState<HeaderCategory[]>([]);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [session, setSession] = useState<LoginResponse | null>(() => getSession());
  async function handleLogout(event: ReactMouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setSession(null); setCart([]); setNotifications([]); setUnreadCount(0);
    try { await logout(); }
    catch { notify.error('Phiên đăng nhập đã được xóa trên thiết bị. Không thể liên hệ máy chủ.'); }
    navigate('/login');
  }
  useEffect(() => {
    let controller: AbortController | undefined;
    const load = () => {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      const report = (error: unknown) => { if (!signal.aborted) notify.error(apiErrorMessage(error), { toastId: 'header-api-error' }); };
      const current = getSession(); setSession(current);
      // Catalog categories are public in the current Backend; private calls still require a session.
      headerApi.categories(signal).then(rows => { if (!signal.aborted) setCategories(rows); }).catch(report);
      if (!current) { setCart([]); setNotifications([]); setUnreadCount(0); return; }
      const accept = <T,>(callback: (value: T) => void) => (value: T) => { if (!signal.aborted && getSession()?.accessToken === current.accessToken) callback(value); };
      me(signal).then(accept(profile => setSession(latest => latest ? { ...latest, ...profile } : null))).catch(report);
      headerApi.notifications(signal).then(accept(page => setNotifications(page.content))).catch(report);
      headerApi.unreadCount(signal).then(accept(setUnreadCount)).catch(report);
      if (current.roles.includes('BUYER')) headerApi.cart(signal).then(accept(data => setCart(data.items))).catch(report);
      else setCart([]);
    };
    load();
    window.addEventListener('nexus:cart-changed', load);
    window.addEventListener('nexus:session-changed', load);
    window.addEventListener('storage', load);
    return () => { controller?.abort(); window.removeEventListener('nexus:cart-changed', load); window.removeEventListener('nexus:session-changed', load); window.removeEventListener('storage', load); };
  }, []);
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => { setSession(getSession()); setCart([]); setNotifications([]); setUnreadCount(0); }, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session]);
  async function markAllRead() {
    try { await headerApi.readAll(); setUnreadCount(0); setNotifications(items => items.map(item => ({ ...item, read: true }))); }
    catch (error) { notify.error(apiErrorMessage(error)); }
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Hà Nội, VN');
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [activeSubnav, setActiveSubnav] = useState('Đồ điện tử & Công nghệ');

  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const cartPreviewRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(target)
      ) {
        setShowCategoryMenu(false);
      }
      if (
        categoryFilterRef.current &&
        !categoryFilterRef.current.contains(target)
      ) {
        setShowCategoryFilter(false);
      }
      if (
        notifMenuRef.current &&
        !notifMenuRef.current.contains(target)
      ) {
        setShowNotificationMenu(false);
      }
      if (
        cartPreviewRef.current &&
        !cartPreviewRef.current.contains(target)
      ) {
        setShowCartPreview(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const subNavItems: SubNavItem[] = [
    { label: 'Đã lưu', href: '#saved' },
    { label: 'Đồ điện tử & Công nghệ', href: '#electronics' },
    { label: 'Xe cộ & Phụ tùng', href: '#vehicles' },
    { label: 'Thời trang', href: '#fashion' },
    { label: 'Đồ sưu tầm & Nghệ thuật', href: '#collectibles' },
    { label: 'Nhà cửa & Đời sống', href: '#home' },
    { label: 'Thể thao', href: '#sports' },
    { label: 'Sức khỏe & Làm đẹp', href: '#beauty' },
    { label: 'Phiên đấu giá sốc', href: '#shock-auctions', isHighlight: true },
    { label: 'Xả kho thanh lý', href: '#clearance' },
  ];

  const locations = [
    'Hà Nội, VN',
    'TP. Hồ Chí Minh, VN',
    'Đà Nẵng, VN',
    'Cần Thơ, VN',
    'Hải Phòng, VN',
    'Nha Trang, VN',
  ];

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    const category = categories.find(item => item.id === selectedCategory);
    if (category) params.set('categoryId', category.id);
    navigate(`/products${params.size ? `?${params}` : ''}`);
  };

  return (
    <header className="nexus-header">
      <div className="nexus-header-container">
        {/* 1. TOP UTILITY BAR */}
        <div className="nexus-top-bar">
          {/* Top Left */}
          <div className="top-bar-left">
            {session ? (
              <span className="top-link">
                Xin chào, <strong className="ms-1 me-1 text-dark">{session.fullName}</strong> |{' '}
                <a href="/login" onClick={handleLogout} className="top-link-primary ms-1">Đăng xuất</a>
              </span>
            ) : (
              <span className="top-link">
                <Link to="/login" className="top-link-primary">Đăng nhập</Link>{' / '}
                <Link to="/register" className="top-link-primary">Đăng ký</Link>
              </span>
            )}

            <span className="top-bar-divider">|</span>

            <a onClick={(event) => { event.preventDefault(); notify.info('Máy chủ chưa cung cấp danh sách ưu đãi.'); }} href="#deals" className="top-link">
              Deals hot
            </a>

            <a onClick={(event) => { event.preventDefault(); navigate('/products?mode=auction'); }} href="#live-auction" className="top-link live-auction-link">
              <span className="pulse-live-dot"></span>
              Đấu giá trực tiếp
            </a>

            <a onClick={(event) => { event.preventDefault(); notify.info('Chưa có dịch vụ hỗ trợ trực tuyến.'); }} href="#help" className="top-link top-link-hide-mobile">
              Trợ giúp & Hỗ trợ
            </a>
          </div>

          {/* Top Right */}
          <div className="top-bar-right">
            {/* Delivery Location Selector */}
            <div className="position-relative">
              <span
                className="top-link location-selector"
                onClick={() => setShowLocationModal(!showLocationModal)}
                title="Thay đổi vị trí giao hàng"
              >
                <i className="bi bi-geo-alt text-secondary"></i> Giao tới:{' '}
                <strong>{currentLocation}</strong>
              </span>

              {showLocationModal && (
                <div
                  className="dropdown-menu-custom popover-menu-right p-3"
                  style={{ width: '220px' }}
                >
                  <div className="fw-bold mb-2 small text-secondary">
                    CHỌN KHU VỰC GIAO HÀNG
                  </div>
                  {locations.map((loc) => (
                    <div
                      key={loc}
                      onClick={() => {
                        setCurrentLocation(loc);
                        setShowLocationModal(false);
                      }}
                      className={`p-2 rounded small cursor-pointer ${
                        currentLocation === loc
                          ? 'bg-primary text-white'
                          : 'hover-bg-light text-dark'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="bi bi-pin-map me-2"></i>
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link to="/seller-hub" className="top-link top-link-hide-mobile">
              Kênh Bán Hàng
            </Link>

            <a onClick={(event) => { event.preventDefault(); navigate('/buyer-hub?tab=saved'); }} href="#wishlist" className="top-link top-link-hide-mobile">
              Yêu thích
            </a>

            <Link to={session ? '/buyer-hub' : '/login'} className="top-link">
              Tài khoản của tôi
            </Link>

            {/* Notification Bell with Badge */}
            <div className="position-relative" ref={notifMenuRef}>
              <button
                type="button"
                className="icon-btn-badge"
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                title="Thông báo"
                aria-label="Thông báo"
              >
                <i className="bi bi-bell" aria-hidden="true"></i>
                <span className="badge-counter badge-red">{unreadCount}</span>
              </button>

              {showNotificationMenu && (
                <div className="dropdown-menu-custom popover-menu-right">
                  <div className="d-flex justify-content-between align-items-center px-3 pb-2 border-bottom">
                    <span className="fw-bold small">Thông báo mới</span>
                    <span
                      className="text-primary small cursor-pointer"
                      onClick={markAllRead}
                      style={{ cursor: 'pointer' }}
                    >
                      Đã đọc tất cả
                    </span>
                  </div>
                  <div className="p-2">
                    {notifications.length === 0 && <p className="small text-muted p-2 mb-0">Không có thông báo.</p>}
                    {notifications.map(item => <div key={item.id} className={`p-2 rounded mb-1 small ${item.read ? '' : 'bg-light'}`} onClick={async () => {
                      try { const detail = await headerApi.notification(item.id); await headerApi.read(item.id); notify.info(detail.content || detail.title); setNotifications(items => items.map(n => n.id === item.id ? { ...n, read: true } : n)); if (!item.read) setUnreadCount(count => Math.max(0, count - 1)); } catch (error) { notify.error(apiErrorMessage(error)); }
                    }}>
                      <div className="fw-semibold text-primary">{item.title}</div>
                      <div className="text-muted">{item.content || 'Nhấn để xem nội dung thông báo.'}</div>
                      <small className="text-secondary">{new Date(item.createdAt).toLocaleString('vi-VN')}</small>
                    </div>)}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Icon with Badge */}
            <div className="position-relative" ref={cartPreviewRef}>
              <button
                type="button"
                className="icon-btn-badge"
                onClick={() => setShowCartPreview(!showCartPreview)}
                title="Giỏ hàng"
                aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
              >
                <i className="bi bi-cart2" aria-hidden="true"></i>
                <span className="badge-counter badge-blue" aria-hidden="true">{cartCount > 99 ? '99+' : cartCount}</span>
              </button>

              {showCartPreview && (
                <div className="dropdown-menu-custom popover-menu-right">
                  <div className="d-flex justify-content-between align-items-center px-3 pb-2 border-bottom">
                    <span className="fw-bold small">Giỏ hàng của bạn ({cartCount})</span>
                    <button
                      type="button"
                      className="text-primary small border-0 bg-transparent p-0"
                      onClick={() => { setShowCartPreview(false); navigate('/cart'); }}
                    >
                      Xem tất cả
                    </button>
                  </div>
                  <div className="p-2">
                    {cart.length === 0 && <p className="small text-muted p-2 mb-0">Giỏ hàng đang trống.</p>}
                    {cart.slice(0, 4).map((item) => {
                      const product = { id: item.productId, title: item.productName || item.productId, price: item.unitPrice };
                      if (!product) return null;
                      return (
                        <Link key={item.id} to={`/products/${product.id}`} className="d-flex gap-2 align-items-center p-2 border-bottom small text-decoration-none" onClick={() => setShowCartPreview(false)}>
                          <div className="flex-grow-1">
                            <div className="fw-semibold text-truncate" style={{ maxWidth: '240px' }}>{product.title}</div>
                            <div className="text-primary fw-bold">{new Intl.NumberFormat('vi-VN').format(product.price)} ₫ × {item.quantity}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="p-3 bg-light rounded-bottom text-center">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm w-100 rounded-pill fw-semibold"
                      onClick={() => { setShowCartPreview(false); navigate('/cart'); }}
                    >
                      Tiến hành thanh toán
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Circle */}
            <button
              type="button"
              className="avatar-circle-btn"
              title={session?.fullName ?? 'Đăng nhập'}
              onClick={() => navigate(session ? '/buyer-hub' : '/login')}
              aria-label="Tài khoản cá nhân"
            >
              <i className="bi bi-person-fill"></i>
            </button>
          </div>
        </div>

        {/* 2. MAIN HEADER BAR */}
        <div className="nexus-main-bar">
          {/* Logo Nexus */}
          <div className="catalog-logo" onClick={() => navigate('/')}>
            <NexusLogo />
          </div>

          {/* Category Dropdown Button */}
          <div className="position-relative" ref={categoryMenuRef}>
            <button
              type="button"
              className={`category-btn ${showCategoryMenu ? 'active' : ''}`}
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              aria-expanded={showCategoryMenu}
            >
              <i className="bi bi-grid-fill"></i>
              <span>Danh mục</span>
              <i className="bi bi-chevron-down"></i>
            </button>

            {showCategoryMenu && (
              <div className="dropdown-menu-custom category-dropdown-panel">
                <div className="fw-bold px-3 py-2 text-secondary small text-uppercase">
                  Tất cả danh mục sản phẩm
                </div>
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`/categories/${cat.id}`}
                    className="category-dropdown-item"
                    onClick={(event) => { event.preventDefault(); setShowCategoryMenu(false); navigate(`/categories/${cat.id}`); }}
                  >
                    <i className="bi bi-grid"></i>
                    <span>{cat.name}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Search Pill Container */}
          <form className="search-pill-container" onSubmit={handleSearchSubmit}>
            <i className="bi bi-search search-lens-icon"></i>
            <input
              type="text"
              className="search-input-field"
              placeholder="Tìm kiếm bất kỳ sản phẩm hoặc phiên đấu giá..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm sản phẩm hoặc phiên đấu giá"
            />

            {/* Camera Visual Search */}
            <button
              type="button"
              className="camera-search-btn"
              title="Tìm kiếm bằng hình ảnh"
              onClick={() =>
                alert('Chức năng tìm kiếm bằng hình ảnh (Visual Search)')
              }
              aria-label="Tìm kiếm bằng hình ảnh"
            >
              <i className="bi bi-camera"></i>
            </button>

            {/* Vertical Divider */}
            <div className="search-divider"></div>

            {/* Category Filter Selector */}
            <div className="category-select-wrapper" ref={categoryFilterRef}>
              <button
                type="button"
                className="category-select-btn"
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              >
                <span>{categories.find(item => item.id === selectedCategory)?.name ?? 'Tất cả danh mục'}</span>
                <i className="bi bi-chevron-down small text-muted"></i>
              </button>

              {showCategoryFilter && (
                <div
                  className="dropdown-menu-custom p-2"
                  style={{ top: 'calc(100% + 12px)', right: 0, width: '220px' }}
                >
                  <div
                    className={`p-2 rounded small cursor-pointer ${
                      selectedCategory === ''
                        ? 'bg-primary text-white'
                        : 'hover-bg-light text-dark'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCategory('');
                      setShowCategoryFilter(false);
                    }}
                  >
                    Tất cả danh mục
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`p-2 rounded small cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-primary text-white'
                          : 'hover-bg-light text-dark'
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setShowCategoryFilter(false);
                      }}
                    >
                      {cat.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Search Button */}
            <button type="submit" className="search-submit-btn">
              Tìm kiếm
            </button>
          </form>

          {/* Sell / Create Auction Action Button */}
          <button
            type="button"
            className="btn-sell-auction"
            onClick={() =>
              navigate('/seller-hub')
            }
          >
            <i className="bi bi-plus-circle"></i>
            <span>Đăng bán / Tạo đấu giá</span>
          </button>
        </div>

        {/* 3. CATEGORIES SUBNAV BAR */}
        <nav className="nexus-subnav-bar" aria-label="Danh mục hàng hóa">
          {subNavItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`subnav-link ${
                activeSubnav === item.label ? 'active' : ''
              } ${item.isHighlight ? 'highlight-tab' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveSubnav(item.label);
                const category = categories.find(cat => cat.name === item.label);
                if (category) navigate('/categories/' + category.id);
                else if (item.href === '#saved') navigate('/buyer-hub?tab=saved');
                else if (item.href === '#shock-auctions') navigate('/products?mode=auction');
                else notify.info('Chưa có danh mục hoặc bộ lọc tương ứng từ máy chủ.');
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Header;
