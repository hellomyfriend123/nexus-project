import { useRoutes } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import LoginPage from '../../features/auth/pages/LoginPage';
import RegisterPage from '../../features/auth/pages/RegisterPage';
import buyerRoutes from '../../roles/buyer/routes';
import sellerRoutes from '../../roles/seller/routes';
import administratorRoutes from '../../roles/administrator/routes';
import PublicRoutes from './PublicRoutes';
import AuthBackgroundLayout from './AuthBackgroundLayout';
import NotFoundPage from '../../shared/pages/NotFoundPage';

const routes: RouteObject[] = [
  ...administratorRoutes,
  {
    element: <PublicRoutes />,
    children: [
      {
        element: <AuthBackgroundLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      ...buyerRoutes,
    ],
  },
  ...sellerRoutes,
  { path: '*', element: <NotFoundPage /> },
];

function AppRoutes() {
  return useRoutes(routes);
}

export default AppRoutes;
