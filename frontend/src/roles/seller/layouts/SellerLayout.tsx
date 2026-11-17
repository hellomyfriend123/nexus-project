import { Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Header from '../../../shared/components/Header/Header';
import Footer from '../../../shared/components/Footer/Footer';
import '../../../shared/styles/variables.css';
import '../../../shared/styles/global.css';
import '../../../shared/styles/theme.css';
import '../../../features/seller-hub/styles/seller-hub.css';
import '../styles/seller-theme.css';
export default function SellerLayout() {
  // Keep the existing shared shell styling; seller-specific UI is scoped separately.
  return <div className="nx-buyer-layout nx-seller-layout"><Header />
      <Outlet /><Footer /></div>;
}
