import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getSession } from '../../../services/auth/session';

// UX guard only. Backend remains responsible for authorization on every request.
export default function AdminGuard() {
  const location = useLocation();
  const [session, setSession] = useState(getSession);
  useEffect(() => {
    const sync = () => setSession(getSession());
    window.addEventListener('nexus:session-changed', sync);
    window.addEventListener('storage', sync);
    const remaining = session ? Date.parse(session.expiresAt) - Date.now() : 0;
    const expiry = session ? window.setTimeout(sync, Math.min(Math.max(remaining, 0), 2147483647)) : undefined;
    return () => {
      window.removeEventListener('nexus:session-changed', sync);
      window.removeEventListener('storage', sync);
      window.clearTimeout(expiry);
    };
  }, [session]);
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!session.roles.includes('ADMIN')) return <Navigate to="/" replace />;
  return <Outlet />;
}
