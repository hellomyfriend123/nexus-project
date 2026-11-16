import type { RouteObject } from 'react-router-dom';
import AdminGuard from './layouts/AdminGuard';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCatalogPage from './pages/AdminCatalogPage';
import AdminCommercePage from './pages/AdminCommercePage';
import AdminFulfillmentPage from './pages/AdminFulfillmentPage';
import AdminAuctionsPage from './pages/AdminAuctionsPage';

const administratorRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'catalog', element: <AdminCatalogPage /> },
          { path: 'commerce', element: <AdminCommercePage /> },
          { path: 'fulfillment', element: <AdminFulfillmentPage /> },
          { path: 'auctions', element: <AdminAuctionsPage /> },
        ],
      },
    ],
  },
];

export default administratorRoutes;
