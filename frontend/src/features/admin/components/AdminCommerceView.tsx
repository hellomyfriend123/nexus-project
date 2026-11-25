import { AdminCommerceCouponModal } from './AdminCommerceCouponModal';
import { AdminCommerceCampaignModal } from './AdminCommerceCampaignModal';
import { AdminCommerceOrderDetailsModal } from './AdminCommerceOrderDetailsModal';
import { AdminCommerceCouponsPanel } from './AdminCommerceCouponsPanel';
import { AdminCommerceCampaignsPanel } from './AdminCommerceCampaignsPanel';
import { AdminCommerceOrdersPanel } from './AdminCommerceOrdersPanel';
import { AdminCommerceTabs } from './AdminCommerceTabs';
import { AdminCommerceHeader } from './AdminCommerceHeader';
import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceView(model: ReturnType<typeof useAdminCommerce>) {
  const { error } = model;
  return (
    <div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <AdminCommerceHeader {...model} />

      <AdminCommerceTabs {...model} />

      {/* TAB 1: ORDERS */}
      <AdminCommerceOrdersPanel {...model} />

      {/* TAB 2: CAMPAIGNS */}
      <AdminCommerceCampaignsPanel {...model} />

      {/* TAB 3: COUPONS */}
      <AdminCommerceCouponsPanel {...model} />

      {/* Order Detail Modal */}
      <AdminCommerceOrderDetailsModal {...model} />

      {/* Campaign Create/Edit Modal */}
      <AdminCommerceCampaignModal {...model} />

      {/* Coupon Create/Edit Modal */}
      <AdminCommerceCouponModal {...model} />
    </div>
  );
}
