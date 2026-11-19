import { useLocation, useNavigate } from 'react-router-dom';
import CreateListingDialog from '../components/CreateListingDialog';
import SellerInventoryPage from '../../seller-inventory/pages/SellerInventoryPage';
import '../styles/create-listing.css';

/**
 * Legacy entry point for /seller/products/new.
 *
 * The create form now lives in a dialog opened from the inventory list. A direct visit to the
 * old URL still has to work, so this route renders the real inventory page underneath with the
 * dialog open. Closing the dialog returns to /seller/products without leaving a dead URL behind.
 */
export default function CreateListingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const leave = () => navigate('/seller/products', { replace: true });
  return (
    <>
      <SellerInventoryPage controlled onAddProduct={() => { /* the dialog is already open here */ }} />
      <CreateListingDialog
        open
        onClose={leave}
        onSaved={() => navigate('/seller/products', { replace: true, state: { listingPublished: true, ...location.state } })}
      />
    </>
  );
}
