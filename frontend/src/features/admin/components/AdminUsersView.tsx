import { AdminUsersStatusModal } from './AdminUsersStatusModal';
import { AdminUsersDetailsModal } from './AdminUsersDetailsModal';
import { AdminUsersFilters } from './AdminUsersFilters';
import { AdminUsersTable } from './AdminUsersTable';
import { AdminUsersHeader } from './AdminUsersHeader';
import type { useAdminUsers } from '../hooks/useAdminUsers';

export function AdminUsersView(model: ReturnType<typeof useAdminUsers>) {
  const { error } = model;
  return (
    <div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <AdminUsersHeader {...model} />

      <div className="nx-admin-card">
        {/* Search & Filter Bar */}
      <AdminUsersFilters {...model} />

        {/* Users Table */}
        <div className="nx-table-container">
          <AdminUsersTable {...model} />
        </div>
      </div>

      {/* User Details Modal (Task U-2) */}
      <AdminUsersDetailsModal {...model} />

      {/* Change Status Modal (Task U-3) */}
      <AdminUsersStatusModal {...model} />
    </div>
  );
}
