import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import SellerSidebar from '../components/SellerSidebar';
import SellerTopBar from '../components/SellerTopBar';
import '../styles/seller.css';

export function SellerLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="nx-seller-layout">
      <SellerSidebar collapsed={collapsed} />
      <div className="nx-seller-main">
        <SellerTopBar onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="nx-seller-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SellerLayout;
