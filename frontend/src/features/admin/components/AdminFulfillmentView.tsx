import { AdminFulfillmentWarehouseModal } from './AdminFulfillmentWarehouseModal';
import { AdminFulfillmentWarehousesPanel } from './AdminFulfillmentWarehousesPanel';
import { AdminFulfillmentInventoryPanel } from './AdminFulfillmentInventoryPanel';
import { AdminFulfillmentTabs } from './AdminFulfillmentTabs';
import { AdminFulfillmentHeader } from './AdminFulfillmentHeader';
import type { useAdminFulfillment } from '../hooks/useAdminFulfillment';

export function AdminFulfillmentView(model: ReturnType<typeof useAdminFulfillment>) {
  const { error } = model;
  return (
    <div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <AdminFulfillmentHeader {...model} />

      <AdminFulfillmentTabs {...model} />

      {/* TAB 1: INVENTORY TRACKING */}
      <AdminFulfillmentInventoryPanel {...model} />

      {/* TAB 2: WAREHOUSES */}
      <AdminFulfillmentWarehousesPanel {...model} />

      {/* Warehouse Modal */}
      <AdminFulfillmentWarehouseModal {...model} />
    </div>
  );
}
