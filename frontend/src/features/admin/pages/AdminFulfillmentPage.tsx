import { useAdminFulfillment } from '../hooks/useAdminFulfillment';
import { AdminFulfillmentView } from '../components/AdminFulfillmentView';
export function AdminFulfillmentPage() {
  return <AdminFulfillmentView {...useAdminFulfillment()} />;
}
export default AdminFulfillmentPage;
