import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import CreateAuctionDialog from '../components/CreateAuctionDialog';
import SellerHubPage from '../../seller-hub/pages/SellerHubPage';
import '../styles/create-auction.css';

/**
 * Legacy entry point for /seller/auctions/new.
 *
 * The form now lives in a dialog opened from the auction list. A direct visit — including the
 * inventory page's /seller/auctions/new?productId=… link — renders the hub underneath with the
 * dialog open and the product preselected.
 */
export default function CreateAuctionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <>
      <SellerHubPage controlled onCreateAuction={() => { /* the dialog is already open here */ }} />
      <CreateAuctionDialog
        open
        productId={params.get('productId')}
        onClose={() => navigate('/seller-hub?tab=auctions', { replace: true })}
        onCreated={auction => navigate(`/seller/auctions/${encodeURIComponent(auction.id)}/result`, { replace: true })}
      />
    </>
  );
}
