import { useAdminCatalog } from '../hooks/useAdminCatalog';
import { AdminCatalogView } from '../components/AdminCatalogView';
export function AdminCatalogPage() {
  return <AdminCatalogView {...useAdminCatalog()} />;
}
export default AdminCatalogPage;
