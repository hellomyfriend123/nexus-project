import AuctionHeader from '../components/AuctionHeader';
import AuctionProductSection from '../components/AuctionProductSection';
import AuctionPricingSection from '../components/AuctionPricingSection';
import AuctionScheduleSection from '../components/AuctionScheduleSection';
import AuctionShippingSection from '../components/AuctionShippingSection';
import AuctionSidebar from '../components/AuctionSidebar';
import AuctionFeedback from '../components/AuctionFeedback';
import { useCreateAuction } from '../hooks/useCreateAuction';
import '../styles/create-auction.css';

export default function CreateAuctionPage() {
  const hub = useCreateAuction();
  return (
    <main className="sca-page">
      <div className="sca-container">
        <AuctionHeader />
        <form onSubmit={hub.submit} noValidate>
          <div className="sca-layout">
            <div className="sca-main">
              <AuctionProductSection hub={hub} />
              <AuctionPricingSection hub={hub} />
              <AuctionScheduleSection hub={hub} />
              <AuctionShippingSection hub={hub} />
            </div>
            <AuctionSidebar hub={hub} />
          </div>
          <AuctionFeedback hub={hub} />
        </form>
      </div>
    </main>
  );
}
