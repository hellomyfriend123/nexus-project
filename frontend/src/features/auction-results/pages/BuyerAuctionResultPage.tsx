import { useParams } from 'react-router-dom';
import type { Outcome } from '../types/auctionResult';
import { useAuctionResult } from '../hooks/useAuctionResult';
import WinnerHero from '../components/WinnerHero';
import LoserHero from '../components/LoserHero';
import ResultCard from '../components/ResultCard';
import BidHistory from '../components/BidHistory';
import ResultAvailability from '../components/ResultAvailability';
import '../styles/auction-results.css';
export default function BuyerAuctionResultPage({ outcome }: { outcome: Outcome }) {
  const { auctionId = '' } = useParams();
  const state = useAuctionResult(auctionId, outcome);
  const result = state.result;
  if (state.loading || state.error || !result) return <ResultAvailability loading={state.loading} error={state.error} onRetry={state.retry} />;
  return <main className={'ar-page ar-compact nx-container ar-outcome-' + outcome}>
    {outcome === 'winner' ? <WinnerHero summary={result.summary} settlement={result.settlement} /> : <LoserHero summary={result.summary} />}
    <div className="ar-result-content"><ResultCard product={result.product} summary={result.summary} outcome={outcome} /><BidHistory bids={result.bids} /></div>
  </main>;
}

