import { useAdminCommerce } from '../hooks/useAdminCommerce';
import { AdminCommerceView } from '../components/AdminCommerceView';
export function AdminCommercePage() {
  return <AdminCommerceView {...useAdminCommerce()} />;
}
export default AdminCommercePage;
