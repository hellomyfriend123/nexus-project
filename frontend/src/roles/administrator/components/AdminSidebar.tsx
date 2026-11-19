import { Link, NavLink } from 'react-router-dom';
import { adminMenuItems } from '../services/adminNavigation';

export function AdminSidebar() {
  return (
    <aside className="nx-admin-sidebar">
      <Link to="/admin" className="nx-admin-brand" aria-label="Tổng quan quản trị Nexus">
        <span className="nx-admin-wordmark">nexus<span>.</span></span>
        <span className="nx-admin-brand-label">Quản trị</span>
      </Link>
      <nav className="nx-admin-nav" aria-label="Điều hướng quản trị">
        {adminMenuItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nx-admin-nav-item ${isActive ? 'active' : ''}`}>
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="nx-admin-sidebar-footer">
        <Link to="/" className="nx-admin-store-link"><i className="bi bi-arrow-left" aria-hidden="true" /> Về cửa hàng</Link>
      </div>
    </aside>
  );
}
export default AdminSidebar;
