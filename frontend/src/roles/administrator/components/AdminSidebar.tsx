import { NavLink, useNavigate } from 'react-router-dom';
import NexusLogo from '../../../shared/components/Logo/NexusLogo';
import { adminMenuItems } from '../services/adminNavigation';
import { useAdminLayoutSession } from '../hooks/useAdminLayoutSession';

interface AdminSidebarProps {
  collapsed?: boolean;
}

export function AdminSidebar({ collapsed = false }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { session, handleLogout } = useAdminLayoutSession();

  return (
    <aside className="nx-admin-sidebar">
      <div className="nx-admin-brand">
        <div className="brand-logo-text" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
          <NexusLogo />
        </div>
      </div>

      <nav className="nx-admin-nav" aria-label="Điều hướng quản trị">
        {adminMenuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nx-admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true"></i>
            <span style={{ flexGrow: 1 }}>{item.label}</span>
            {item.badge && !collapsed && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                }}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="nx-admin-sidebar-footer">
        <div className="nx-admin-user-info">
          <div className="nx-admin-user-avatar">
            {session?.fullName?.charAt(0) || 'A'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {session?.fullName || 'Quản trị viên'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {session?.email || 'admin@nexus.vn'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="nx-btn nx-btn-outline nx-btn-sm"
            style={{ flex: 1, color: '#cbd5e1', borderColor: '#334155' }}
            onClick={() => navigate('/')}
            title="Quay lại sàn Nexus"
          >
            <i className="bi bi-shop" aria-hidden="true"></i> Sàn Nexus
          </button>
          <button
            type="button"
            className="nx-btn nx-btn-danger nx-btn-sm"
            onClick={handleLogout}
            title="Đăng xuất khỏi hệ thống"
            aria-label="Đăng xuất khỏi hệ thống"
          >
            <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
