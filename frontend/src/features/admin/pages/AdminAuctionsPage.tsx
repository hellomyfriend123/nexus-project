import { useAdminAuctions } from '../hooks/useAdminAuctions';
import { AdminAuctionsView } from '../components/AdminAuctionsView';
export function AdminAuctionsPage() {
  return <AdminAuctionsView {...useAdminAuctions()} />;
}
export default AdminAuctionsPage;
