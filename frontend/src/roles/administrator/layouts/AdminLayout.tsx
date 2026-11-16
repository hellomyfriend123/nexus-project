import { Outlet } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';
import '../styles/admin.css';

export function AdminLayout() {
  return (
    <div className="nx-admin-layout">
      <AdminSidebar />
      <div className="nx-admin-main">
        <AdminTopBar />
        <main className="nx-admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
