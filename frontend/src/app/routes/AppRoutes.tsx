import { useRoutes } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import LoginPage from '../../features/auth/pages/LoginPage';
import GoogleCallbackPage from '../../features/auth/pages/GoogleCallbackPage';
import RegisterPage from '../../features/auth/pages/RegisterPage';
import buyerRoutes from '../../roles/buyer/routes';
import sellerRoutes from '../../roles/seller/routes';
import administratorRoutes from '../../roles/administrator/routes';
import PublicRoutes from './PublicRoutes';
import AuthBackgroundLayout from './AuthBackgroundLayout';
import NotFoundPage from '../../shared/pages/NotFoundPage';

import ComingSoonPreviewPage from '../../shared/pages/preview';

const routes: RouteObject[] = [

  ...(import.meta.env.DEV
    ? [{ path: '/preview', element: <ComingSoonPreviewPage /> }]
    : []),

  {
    element: <PublicRoutes />, children: [
      {
        element: <AuthBackgroundLayout />, children: [
          { path: '/oauth2/callback', element: <GoogleCallbackPage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '*', element: <NotFoundPage /> },
        ]
      },
      ...buyerRoutes,
    ]
  },
  ...sellerRoutes,
  ...administratorRoutes,
];
function AppRoutes() { return useRoutes(routes); }
export default AppRoutes;
