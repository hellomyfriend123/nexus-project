import { Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Header from '../../../shared/components/Header/Header.jsx';
import Footer from '../../../shared/components/Footer/Footer.jsx';
import '../../../shared/styles/variables.css';
import '../../../shared/styles/global.css';
import '../../../shared/styles/theme.css';
import '../../../features/product/styles/product.css';
import '../../../features/home/styles/home.css';
import '../../../features/category/styles/category.css';
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
