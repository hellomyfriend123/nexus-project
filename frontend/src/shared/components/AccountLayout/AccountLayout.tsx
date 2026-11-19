import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountSidebar, { resolveActiveMenuItem, type AccountMenuItem } from './AccountSidebar';
import './account-layout.css';

export interface AccountLayoutProps {
  items: AccountMenuItem[];
  /** Accessible name for the account navigation. */
  label: string;
  children: ReactNode;
}

/**
 * Shared frame for buyer and seller account pages.
 *
 * Desktop: 240px rail plus a `min-width: 0` content column so wide tables scroll inside the
 * column instead of pushing the page sideways. Below 900px the rail collapses into a native
 * <select> that always shows the active section, so a long menu never pushes content down.
 */
export default function AccountLayout({ items, label, children }: AccountLayoutProps) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const pickerId = useId();
  const active = resolveActiveMenuItem(items, pathname, search);
  const [selected, setSelected] = useState(active?.to ?? items[0]?.to ?? '');

  // Keep the picker in sync when navigation happens elsewhere (sidebar, Back/Forward, deep link).
  useEffect(() => { if (active) setSelected(active.to); }, [active?.to]);

  return (
    <div className="nx-account">
      <div className="nx-account__container">
        <AccountSidebar items={items} label={label} />
        <div className="nx-account__mobile-picker">
          <label className="nx-account__mobile-label" htmlFor={pickerId}>Mục tài khoản</label>
          <select
            id={pickerId}
            className="nx-account__select"
            value={selected}
            onChange={event => {
              setSelected(event.target.value);
              navigate(event.target.value);
            }}
          >
            {items.map(item => <option key={item.to} value={item.to}>{item.label}</option>)}
          </select>
        </div>
        <div className="nx-account__content">{children}</div>
      </div>
    </div>
  );
}
