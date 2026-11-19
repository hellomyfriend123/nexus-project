import { Outlet } from 'react-router-dom';
import AccountLayout from '../../../shared/components/AccountLayout/AccountLayout';
import type { AccountMenuItem } from '../../../shared/components/AccountLayout';

interface AccountLayoutRouteProps {
  items: AccountMenuItem[];
  label: string;
}

/** Wraps the account sub-routes in one shared frame; the route file supplies the menu. */
export default function AccountLayoutRoute({ items, label }: AccountLayoutRouteProps) {
  return (
      <AccountLayout items={items} label={label}>
        <Outlet />
      </AccountLayout>
  );
}
