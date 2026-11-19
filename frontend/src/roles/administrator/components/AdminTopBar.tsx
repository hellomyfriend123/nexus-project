import { useAdminLayoutSession } from '../hooks/useAdminLayoutSession';

export function AdminTopBar() {
  const { session, handleLogout } = useAdminLayoutSession();
  return (
    <header className="nx-admin-topbar">
      <span className="nx-admin-topbar-title">Quản trị Nexus</span>
      <div className="nx-admin-topbar-account">
        <span className="nx-admin-topbar-name">{session?.fullName || 'Quản trị viên'}</span>
        <button type="button" className="nx-btn nx-btn-outline nx-btn-sm" onClick={handleLogout} aria-label="Đăng xuất">
          <i className="bi bi-box-arrow-right" aria-hidden="true" /><span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
export default AdminTopBar;
