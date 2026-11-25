import { Navigate, Outlet, useLocation } from 'react-router-dom';
// Frontend route gating is not a substitute for Backend authorization.
// No session provider exists yet: deny by default; do not mount until auth integration.
function ProtectedRoutes({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  const location = useLocation();
  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}

export default ProtectedRoutes;
