import { useSyncExternalStore } from 'react';
import { getSession } from '../../../services/api/auth';

function subscribe(changed: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const sync = () => {
    clearTimeout(timer);
    changed();
    const session = getSession();
    if (session) timer = setTimeout(sync, Math.min(2147483647, Math.max(1, Date.parse(session.expiresAt) - Date.now())));
  };
  window.addEventListener('nexus:session-changed', sync);
  window.addEventListener('storage', sync);
  sync();
  return () => {
    clearTimeout(timer);
    window.removeEventListener('nexus:session-changed', sync);
    window.removeEventListener('storage', sync);
  };
}
export function useCartSession() {
  return useSyncExternalStore(subscribe, () => getSession()?.accessToken ?? null, () => null);
}
