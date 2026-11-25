import type { RouteObject } from 'react-router-dom';
import SellerLayout from './layouts/SellerLayout';
import SellerHubPage from '../../features/seller-hub/pages/SellerHubPage';
import SellerInventoryPage from '../../features/seller-inventory/pages/SellerInventoryPage';
import CreateListingPage from '../../features/seller-listing/pages/CreateListingPage';
import OrderSuccessPage from '../../features/seller-order-success/pages/OrderSuccessPage';
import { sellerAccountMenu } from '../../features/seller-hub/constants/accountMenu';
import AccountLayoutRoute from '../../features/account/layouts/AccountLayoutRoute';
import ProfilePage from '../../features/account/pages/ProfilePage';
import AddressPage from '../../features/account/pages/AddressPage';
import PasswordPage from '../../features/account/pages/PasswordPage';

import CreateAuctionPage from '../../features/seller-auction/pages/CreateAuctionPage';
import SellerAuctionResultPage from '../../features/seller-auction-result/pages/SellerAuctionResultPage';

// UI-only route: authorization is outside this integration task.
const sellerRoutes: RouteObject[] = [
  {
    element: <SellerLayout />,
    children: [
      {
        element: <AccountLayoutRoute items={sellerAccountMenu} label="Tài khoản người bán" />,
        children: [
      { path: '/seller/auctions/new', element: <CreateAuctionPage /> },
      { path: '/seller/auctions/:auctionId/result', element: <SellerAuctionResultPage /> },
      { path: '/seller-hub', element: <SellerHubPage /> },
      { path: '/seller/products', element: <SellerInventoryPage /> },
      { path: '/seller/products/new', element: <CreateListingPage /> },
      { path: '/seller/products/:productId/edit', element: <CreateListingPage /> },
      { path: '/seller/orders/success', element: <OrderSuccessPage /> },
          { path: '/seller/profile', element: <ProfilePage role="SELLER" /> },
          { path: '/seller/address', element: <AddressPage role="SELLER" /> },
          { path: '/seller/password', element: <PasswordPage /> },
        ],
      },
    ],
  },
];
export default sellerRoutes;
