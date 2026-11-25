import { useAdminUsers } from '../hooks/useAdminUsers';
import { AdminUsersView } from '../components/AdminUsersView';
export function AdminUsersPage() {
  return <AdminUsersView {...useAdminUsers()} />;
}
export default AdminUsersPage;
