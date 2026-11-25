import { Outlet } from 'react-router-dom';
// Public screens do not require an authenticated session.
function PublicRoutes() {
  return <Outlet />;
}

export default PublicRoutes;
