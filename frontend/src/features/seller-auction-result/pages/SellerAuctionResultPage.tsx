import AuctionSuccessHero from '../components/AuctionSuccessHero';
import PaymentCountdown from '../components/PaymentCountdown';
import FulfillmentSteps from '../components/FulfillmentSteps';
import WinnerProfile from '../components/WinnerProfile';
import AuctionProductDetails from '../components/AuctionProductDetails';
import BidAuditLog from '../components/BidAuditLog';
import SellerProtection from '../components/SellerProtection';
import SecondChance from '../components/SecondChance';
import AuctionSupport from '../components/AuctionSupport';
import AuctionResultDialog from '../components/AuctionResultDialog';
import { useSellerAuctionResult } from '../hooks/useSellerAuctionResult';
import '../styles/auction-result.css';

export default function SellerAuctionResultPage() {
  const hub = useSellerAuctionResult();

  if (hub.loading) return <main className="nx-auction-result"><div className="nx-container" role="status">Đang tải kết quả đấu giá…</div></main>;
  if (hub.error || !hub.result) return <main className="nx-auction-result"><div className="nx-container"><p role="alert">{hub.error || 'Không có kết quả.'}</p><button onClick={hub.retry}>Thử lại</button></div></main>;
  return (
    <main className="nx-auction-result">
      <div className="nx-container">
        <AuctionSuccessHero result={hub.result} onAction={hub.openAction} />
        <PaymentCountdown countdown={hub.result.countdown} paymentWindow={hub.result.paymentWindow} />
        <FulfillmentSteps result={hub.result} />
        <div className="nx-ar-layout">
          <div className="nx-ar-main-column">
            <WinnerProfile result={hub.result} onAction={hub.openAction} />
            <AuctionProductDetails
              result={hub.result}
              checked={hub.checked}
              onCheck={hub.setChecked}
              onAction={hub.openAction}
            />
          </div>
          <aside className="nx-ar-aside">
            <BidAuditLog result={hub.result} onAction={hub.openAction} />
            <SellerProtection result={hub.result} onAction={hub.openAction} />
            <SecondChance message={hub.result.secondChance} onAction={hub.openAction} />
            <AuctionSupport onSupport={hub.openSupport} />
          </aside>
        </div>
      </div>
      <AuctionResultDialog
        action={hub.action}
        result={hub.result}
        content={hub.dialogContent}
        onClose={hub.closeDialog}
        onLoadMore={hub.loadMoreBids} loading={hub.bidLoading} error={hub.bidError}
      />
    </main>
  );
}
