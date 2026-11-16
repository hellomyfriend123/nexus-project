import type { RouteObject } from 'react-router-dom';
import SellerLayout from './layouts/SellerLayout';
import SellerDashboardPage from './pages/SellerDashboardPage';
import SellerCatalogPage from './pages/SellerCatalogPage';
import SellerFulfillmentPage from './pages/SellerFulfillmentPage';
import SellerOrdersPage from './pages/SellerOrdersPage';
import SellerAuctionsPage from './pages/SellerAuctionsPage';
import SellerProfilePage from './pages/SellerProfilePage';

const sellerRoutes: RouteObject[] = [
  {
    path: '/seller',
    element: <SellerLayout />,
    children: [
      { index: true, element: <SellerDashboardPage /> },
      { path: 'products', element: <SellerCatalogPage /> },
      { path: 'inventory', element: <SellerFulfillmentPage /> },
      { path: 'orders', element: <SellerOrdersPage /> },
      { path: 'auctions', element: <SellerAuctionsPage /> },
      { path: 'profile', element: <SellerProfilePage /> },
    ],
  },
];

export default sellerRoutes;
