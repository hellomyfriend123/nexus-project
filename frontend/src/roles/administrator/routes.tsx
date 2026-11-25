import type { RouteObject } from 'react-router-dom';
import AdminGuard from './layouts/AdminGuard';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from '../../features/admin/pages/AdminDashboardPage';
import AdminUsersPage from '../../features/admin/pages/AdminUsersPage';
import AdminCatalogPage from '../../features/admin/pages/AdminCatalogPage';
import AdminCommercePage from '../../features/admin/pages/AdminCommercePage';
import AdminFulfillmentPage from '../../features/admin/pages/AdminFulfillmentPage';
import AdminAuctionsPage from '../../features/admin/pages/AdminAuctionsPage';

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
