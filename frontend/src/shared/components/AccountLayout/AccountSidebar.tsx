import { Link, useLocation } from 'react-router-dom';

export interface AccountMenuItem {
  to: string;
  label: string;
  icon: string;
  /** Match the path exactly; use for a section index that must not stay active on child routes. */
  end?: boolean;
}

export interface AccountSidebarProps {
  items: AccountMenuItem[];
  /** Accessible name for the navigation landmark. */
  label: string;
}

export function isMenuItemActive(item: AccountMenuItem, pathname: string, search: string): boolean {
  const [path, query] = item.to.split('?');
  if (item.end) return pathname === path;
  if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
  // /seller-hub?tab=orders and /seller-hub?tab=auctions share a path, so the query decides.
  if (!query) return true;
  const wanted = new URLSearchParams(query);
  const current = new URLSearchParams(search);
  for (const [key, value] of wanted) if (current.get(key) !== value) return false;
  return true;
}

/**
 * Resolves the single item that the account menu should highlight.
 *
 * Hub entries share one path and are split by ?tab=. A bare /seller-hub has no ?tab yet, while
 * the hub hook falls back to its products section, so a plain path match (an entry without a
 * query, or the first hub entry) stands in for the missing tab. Without this fallback the menu
 * would highlight nothing on first load or on any copy-pasted hub URL.
 */
export function resolveActiveMenuItem(items: AccountMenuItem[], pathname: string, search: string): AccountMenuItem | undefined {
  // Legacy detail/create URLs stay in the same workspace section.
  const tab = pathname.startsWith('/seller/products') ? 'products' : pathname.startsWith('/seller/auctions') ? 'auctions' : pathname.startsWith('/seller/orders') ? 'orders' : null;
  if (tab) return items.find(item => item.to === `/seller-hub?tab=${tab}`);
  const exact = items.find(item => isMenuItemActive(item, pathname, search));
  if (exact) return exact;
  // Same path, different/absent tab: use the first entry on that path.
  const samePath = items.filter(item => item.to.split('?')[0] === pathname);
  return samePath[0] ?? items.find(item => pathname.startsWith(`${item.to.split('?')[0]}/`));
}

/** Desktop rail for the account area. Rendering is CSS-driven; the mobile picker lives in AccountLayout. */
export default function AccountSidebar({ items, label }: AccountSidebarProps) {
  const { pathname, search } = useLocation();
  const active = resolveActiveMenuItem(items, pathname, search);
  return (
    <aside className="nx-account__rail">
      <nav className="nx-account__nav" aria-label={label}>
        {items.map(item => (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active?.to === item.to ? 'page' : undefined}
            className={`nx-account__nav-item ${active?.to === item.to ? 'is-active' : ''}`}
          >
            <i className={`bi bi-${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
