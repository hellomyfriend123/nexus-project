import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, logout } from '../../../services/api/auth';
export function useAdminLayoutSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState(getSession);
  useEffect(() => {
    const sync = () => setSession(getSession());
    window.addEventListener('nexus:session-changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('nexus:session-changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const handleLogout = async () => {
    try { await logout(); }
    catch { /* Existing logout clears the local session even if the server is unavailable. */ }
    finally { navigate('/login'); }
  };
  return { session, handleLogout };
}
