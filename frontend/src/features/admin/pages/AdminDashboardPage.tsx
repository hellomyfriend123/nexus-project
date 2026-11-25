import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { AdminDashboardView } from '../components/AdminDashboardView';
export function AdminDashboardPage() {
  return <AdminDashboardView {...useAdminDashboard()} />;
}
export default AdminDashboardPage;
