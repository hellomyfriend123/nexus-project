import { Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Header from '../../../shared/components/Header/Header';
import Footer from '../../../shared/components/Footer/Footer';
import '../../../shared/styles/variables.css';
import '../../../shared/styles/global.css';
import '../../../shared/styles/theme.css';
import '../../../features/product/styles/product.css';
import '../../../features/home/styles/home.css';
import '../../../features/category/styles/category.css';
import '../../../features/cart/styles/cart.css';
import '../../../features/buyer-hub/styles/buyer-hub.css';
function BuyerLayout() {
  return (
    <div className="nx-buyer-layout">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

export default BuyerLayout;
