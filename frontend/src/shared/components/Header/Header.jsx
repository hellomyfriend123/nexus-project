import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSession, logout } from '../../../features/auth/services/auth.api';
import NexusLogo from '../Logo/NexusLogo';
import { notify } from '../Toast';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const [session, setSession] = useState(getSession);
  async function handleLogout(event) {
    event.preventDefault();
    setSession(null);
    try { await logout(); }
    catch { notify.error('Phiên đăng nhập đã được xóa trên thiết bị. Không thể liên hệ máy chủ.'); }
    navigate('/login');
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả danh mục');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Hà Nội, VN');
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [activeSubnav, setActiveSubnav] = useState('Đồ điện tử & Công nghệ');

  const categoryMenuRef = useRef(null);
  const categoryFilterRef = useRef(null);
  const notifMenuRef = useRef(null);
  const cartPreviewRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target)
      ) {
        setShowCategoryMenu(false);
      }
      if (
        categoryFilterRef.current &&
        !categoryFilterRef.current.contains(event.target)
      ) {
        setShowCategoryFilter(false);
      }
      if (
        notifMenuRef.current &&
        !notifMenuRef.current.contains(event.target)
      ) {
        setShowNotificationMenu(false);
      }
      if (
        cartPreviewRef.current &&
        !cartPreviewRef.current.contains(event.target)
      ) {
        setShowCartPreview(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    { name: 'Đồ điện tử & Công nghệ', icon: 'bi-laptop' },
    { name: 'Xe cộ & Phụ tùng', icon: 'bi-car-front' },
    { name: 'Thời trang & Phụ kiện', icon: 'bi-handbag' },
    { name: 'Đồ sưu tầm & Nghệ thuật', icon: 'bi-gem' },
    { name: 'Nhà cửa & Đời sống', icon: 'bi-house-heart' },
    { name: 'Thể thao & Dã ngoại', icon: 'bi-bicycle' },
    { name: 'Sức khỏe & Làm đẹp', icon: 'bi-heart-pulse' },
    { name: 'Đồng hồ & Trang sức', icon: 'bi-watch' },
    { name: 'Sách & Văn phòng phẩm', icon: 'bi-book' },
  ];

  const subNavItems = [
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
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

            <a href="#deals" className="top-link">
              Deals hot
            </a>

            <a href="#live-auction" className="top-link live-auction-link">
              <span className="pulse-live-dot"></span>
              Đấu giá trực tiếp
            </a>

            <a href="#help" className="top-link top-link-hide-mobile">
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

            <Link to="/seller" className="top-link top-link-hide-mobile">
              Kênh Bán Hàng
            </Link>

            {session?.roles?.includes('ADMINISTRATOR') && (
              <Link to="/admin" className="top-link text-primary fw-bold">
                <i className="bi bi-shield-check me-1"></i> Quản trị Admin
              </Link>
            )}

            <a href="#wishlist" className="top-link top-link-hide-mobile">
              Yêu thích
            </a>

            <a href={session ? '/' : '/login'} className="top-link">
              Tài khoản của tôi
            </a>

            {/* Notification Bell with Badge */}
            <div className="position-relative" ref={notifMenuRef}>
              <button
                type="button"
                className="icon-btn-badge"
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                title="Thông báo"
                aria-label="Thông báo"
              >
                <i className="bi bi-bell"></i>
                <span className="badge-counter badge-red">3</span>
              </button>

              {showNotificationMenu && (
                <div className="dropdown-menu-custom popover-menu-right">
                  <div className="d-flex justify-content-between align-items-center px-3 pb-2 border-bottom">
                    <span className="fw-bold small">Thông báo mới</span>
                    <span
                      className="text-primary small cursor-pointer"
                      style={{ cursor: 'pointer' }}
                    >
                      Đã đọc tất cả
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="p-2 rounded mb-1 bg-light small">
                      <div className="fw-semibold text-danger">
                        🔥 Phiên đấu giá Rolex Submariner
                      </div>
                      <div className="text-muted">
                        Bạn đã bị trả giá cao hơn! Đặt giá lại ngay.
                      </div>
                      <small className="text-secondary">2 phút trước</small>
                    </div>
                    <div className="p-2 rounded mb-1 small">
                      <div className="fw-semibold text-primary">
                        📦 Đơn hàng #NX-9821
                      </div>
                      <div className="text-muted">
                        Đang trên đường giao tới bạn tại Hà Nội.
                      </div>
                      <small className="text-secondary">1 giờ trước</small>
                    </div>
                    <div className="p-2 rounded small">
                      <div className="fw-semibold text-success">
                        🎉 Voucher 100k đã vào ví
                      </div>
                      <div className="text-muted">
                        Ưu đãi giảm giá độc quyền thành viên Nexus.
                      </div>
                      <small className="text-secondary">Hôm qua</small>
                    </div>
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
                aria-label="Giỏ hàng"
              >
                <i className="bi bi-cart2"></i>
                <span className="badge-counter badge-blue">2</span>
              </button>

              {showCartPreview && (
                <div className="dropdown-menu-custom popover-menu-right">
                  <div className="d-flex justify-content-between align-items-center px-3 pb-2 border-bottom">
                    <span className="fw-bold small">Giỏ hàng của bạn (2)</span>
                    <a href="#cart" className="text-primary small">
                      Xem tất cả
                    </a>
                  </div>
                  <div className="p-2">
                    <div className="d-flex gap-2 align-items-center p-2 border-bottom small">
                      <div
                        className="bg-light rounded p-2 text-center"
                        style={{ width: '40px', height: '40px' }}
                      >
                        <i className="bi bi-laptop"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div
                          className="fw-semibold text-truncate"
                          style={{ maxWidth: '180px' }}
                        >
                          MacBook Pro M3 Max 16"
                        </div>
                        <div className="text-primary fw-bold">54.990.000₫</div>
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-center p-2 small">
                      <div
                        className="bg-light rounded p-2 text-center"
                        style={{ width: '40px', height: '40px' }}
                      >
                        <i className="bi bi-watch"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div
                          className="fw-semibold text-truncate"
                          style={{ maxWidth: '180px' }}
                        >
                          Đồng hồ Vintage Omega Seamaster
                        </div>
                        <div className="text-primary fw-bold">18.500.000₫</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-light rounded-bottom text-center">
                    <button className="btn btn-primary btn-sm w-100 rounded-pill fw-semibold">
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
              onClick={() => navigate(session ? '/' : '/login')}
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
                    key={cat.name}
                    href={`#${cat.name}`}
                    className="category-dropdown-item"
                    onClick={() => setShowCategoryMenu(false)}
                  >
                    <i className={`bi ${cat.icon}`}></i>
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
                <span>{selectedCategory}</span>
                <i className="bi bi-chevron-down small text-muted"></i>
              </button>

              {showCategoryFilter && (
                <div
                  className="dropdown-menu-custom p-2"
                  style={{ top: 'calc(100% + 12px)', right: 0, width: '220px' }}
                >
                  <div
                    className={`p-2 rounded small cursor-pointer ${
                      selectedCategory === 'Tất cả danh mục'
                        ? 'bg-primary text-white'
                        : 'hover-bg-light text-dark'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCategory('Tất cả danh mục');
                      setShowCategoryFilter(false);
                    }}
                  >
                    Tất cả danh mục
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat.name}
                      className={`p-2 rounded small cursor-pointer ${
                        selectedCategory === cat.name
                          ? 'bg-primary text-white'
                          : 'hover-bg-light text-dark'
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedCategory(cat.name);
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
            onClick={() => navigate('/seller/products')}
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
