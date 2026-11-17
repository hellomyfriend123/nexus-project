import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeGoogleSignIn } from '../../../services/api/auth';

export function useGoogleCallback() {
  const navigate = useNavigate();
  const task = useRef<ReturnType<typeof completeGoogleSignIn> | null>(null);
  const mounted = useRef(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true; mounted.current = true;
    if (!task.current) {
      const search = window.location.search;
      // Remove the one-time code before requests, error rendering or navigation.
      window.history.replaceState(null, '', window.location.pathname);
      task.current = completeGoogleSignIn(search, () => mounted.current);
    }
    task.current.then(({ role }) => {
      if (active) navigate(role === 'seller' ? '/seller-hub' : '/buyer-hub', { replace: true });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; mounted.current = false; };
  }, [navigate]);
  return { failed };
}
