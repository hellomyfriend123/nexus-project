import { Outlet } from 'react-router-dom';
import DotGridBackground from '../../shared/components/Background/DotGridBackground';

/** Decorative background is scoped to login, registration, and not-found routes only. */
export default function AuthBackgroundLayout() {
  return (
    <div className="u363-shell">
      <DotGridBackground />
      <div className="u363-content"><Outlet /></div>
    </div>
  );
}