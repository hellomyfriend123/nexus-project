import { useParams } from 'react-router-dom';
import type { Outcome } from '../types/auctionResult';
import { useAuctionResult } from '../hooks/useAuctionResult';
import WinnerHero from '../components/WinnerHero';
import LoserHero from '../components/LoserHero';
import ResultCard from '../components/ResultCard';
import BidHistory from '../components/BidHistory';
import FulfillmentJourney from '../components/FulfillmentJourney';
import EscrowProtection from '../components/EscrowProtection';
import SettlementStatus from '../components/SettlementStatus';
import SecondChanceOffer from '../components/SecondChanceOffer';
import BidPriceChart from '../components/BidPriceChart';
import RecommendationGrid from '../components/RecommendationGrid';
import ResultAvailability from '../components/ResultAvailability';
import '../styles/auction-results.css';
export default function BuyerAuctionResultPage({ outcome }: { outcome: Outcome }) {
  const { auctionId = '' } = useParams();
  const state = useAuctionResult(auctionId, outcome);
  const result = state.result;
  if (state.loading || state.error || !result) return <ResultAvailability loading={state.loading} error={state.error} onRetry={state.retry} />;
  return <main className={`ar-page nx-container ar-outcome-${outcome}`}>
    <p className="ar-demo-notice">Kết quả và lịch sử giá từ máy chủ. Hoàn cọc, cơ hội thứ hai, thanh toán và đề xuất chưa được API hỗ trợ trên màn hình này.</p>
    {outcome === 'winner' ? <WinnerHero summary={result.summary} settlement={result.settlement} seconds={state.seconds} onAction={state.mockAction} /> : <LoserHero summary={result.summary} onAction={state.mockAction} />}
    <div className="ar-columns"><div className="ar-main-column"><ResultCard product={result.product} summary={result.summary} outcome={outcome} onAction={state.mockAction} />
      {outcome === 'loser' && <SecondChanceOffer amount={result.summary.personalBid ?? 0} subscribed={state.subscribed} onSubscribe={state.setSubscribed} onAction={state.mockAction} />}
      <BidHistory key={outcome} bids={result.bids} outcome={outcome} onAction={state.mockAction} />
    </div><aside className="ar-aside">{outcome === 'winner' ? <><FulfillmentJourney steps={result.settlement.steps} /><EscrowProtection benefits={result.settlement.escrowBenefits} onAction={state.mockAction} /></> : <><SettlementStatus summary={result.summary} settlement={result.settlement} onAction={state.mockAction} /><BidPriceChart /><section className="ar-panel ar-fair-play"><h2><i className="bi bi-shield-check ar-green" /> Minh bạch & Phòng chống gian lận thầu</h2><p>Chưa có API tra cứu chính sách hoặc gửi báo cáo nghi vấn cho phiên này.</p><button className="ar-text-button" onClick={() => state.mockAction('Hướng dẫn phòng chống gian lận')}>Báo cáo nghi vấn gian lận phiên này →</button></section></>}</aside></div>
    <RecommendationGrid items={result.recommendations} outcome={outcome} onAction={state.mockAction} />
    {outcome === 'loser' && <section className="ar-support"><div><b><i className="bi bi-headset ar-blue" /> Bạn cần hỗ trợ phân tích phiên đấu giá hoặc tìm nguồn máy tương tự?</b><small>Chưa có API hỗ trợ trực tuyến trên màn hình này.</small></div><div className="ar-actions"><button className="ar-button ar-white" onClick={() => state.mockAction('Xem câu hỏi thường gặp')}>Xem Câu hỏi thường gặp</button><button className="ar-button ar-primary" onClick={() => state.mockAction('Chat với Chuyên viên')}>Chat với Chuyên viên</button></div></section>}
    {state.notice && <div className="ar-action-notice" role="status"><p>{state.notice}</p><button aria-label="Đóng thông báo" onClick={state.dismissNotice}>×</button></div>}
  </main>;
}
