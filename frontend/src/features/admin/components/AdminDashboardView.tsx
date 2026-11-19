import { AdminDashboardRecentOrders } from './AdminDashboardRecentOrders';
import { AdminDashboardStats } from './AdminDashboardStats';
import { AdminDashboardHeader } from './AdminDashboardHeader';
import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardView(model: ReturnType<typeof useAdminDashboard>) {
  return (
    <div aria-busy={model.loading}>
      <AdminDashboardHeader {...model} />
      {model.error && <div className="alert alert-warning" role="alert">{model.error}</div>}
      <AdminDashboardStats {...model} />
      <AdminDashboardRecentOrders {...model} />
    </div>
  );
}
