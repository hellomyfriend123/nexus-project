import type { RouteObject } from 'react-router-dom';
import BuyerLayout from './layouts/BuyerLayout';
import HomePage from '../../features/home/pages/HomePage';
import CategoryPage from '../../features/category/pages/CategoryPage';
import ProductPage from '../../features/product/pages/ProductPage';
import ProductDetailPage from '../../features/product/pages/ProductDetailPage';
const buyerRoutes: RouteObject[] = [
  {
    element: <BuyerLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'categories', element: <CategoryPage /> },
      { path: 'categories/:categoryId', element: <CategoryPage /> },
      { path: 'products', element: <ProductPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },

    ],
  },
];
export default buyerRoutes;
