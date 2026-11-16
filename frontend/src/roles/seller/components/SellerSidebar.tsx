import { NavLink, useNavigate } from 'react-router-dom';
import NexusLogo from '../../../shared/components/Logo/NexusLogo';
import { getSession, logout } from '../../../features/auth/services/auth.api';

interface SellerSidebarProps {
  collapsed?: boolean;
}

export function SellerSidebar({ collapsed = false }: SellerSidebarProps) {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const menuItems = [
    {
      to: '/seller',
      end: true,
      label: 'Tổng quan (Dashboard)',
      icon: 'bi-grid-1x2-fill',
    },
    {
      to: '/seller/products',
      label: 'Sản phẩm & Danh mục',
      icon: 'bi-box-seam-fill',
      badge: 'FR-05, 07, 08, 10',
    },
    {
      to: '/seller/inventory',
      label: 'Tồn kho & Vận chuyển',
      icon: 'bi-boxes',
      badge: 'FR-13, 14, 38, 39',
    },
    {
      to: '/seller/orders',
      label: 'Đơn hàng bán',
      icon: 'bi-receipt-cutoff',
      badge: 'FR-23, 24, 25',
    },
    {
      to: '/seller/auctions',
      label: 'Phiên đấu giá',
      icon: 'bi-hammer',
      badge: 'FR-26, 27, 37',
    },
    {
      to: '/seller/profile',
      label: 'Hồ sơ người bán',
      icon: 'bi-shop-window',
      badge: 'FR-03',
    },
  ];

  return (
    <aside className={`nx-seller-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="nx-seller-sidebar-header">
        <div className="d-flex align-items-center gap-2">
          <NexusLogo />
          <span className="badge bg-primary text-white" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
            SELLER
          </span>
        </div>
      </div>

      <nav className="nx-seller-sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nx-seller-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`} />
            <div className="d-flex flex-column flex-grow-1">
              <span>{item.label}</span>
              {item.badge && (
                <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 400 }}>
                  {item.badge}
                </span>
              )}
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="nx-seller-sidebar-footer">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div
              className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '36px', height: '36px', fontSize: '14px', flexShrink: 0 }}
            >
              <i className="bi bi-person-fill"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-truncate fw-semibold" style={{ fontSize: '13px' }}>
                {session?.fullName || 'Seller Shop'}
              </div>
              <div className="text-truncate text-muted" style={{ fontSize: '11px' }}>
                {session?.email || 'seller@nexus.vn'}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-column gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
            onClick={() => navigate('/')}
          >
            <i className="bi bi-shop"></i>
            <span>Về sàn mua sắm</span>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default SellerSidebar;
