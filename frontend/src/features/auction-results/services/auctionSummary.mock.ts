// Legacy UI fixture only. Not used by the live result screen. TODO: remove after visual fixture migration.
import type { AuctionSummary } from '../types/auctionResult';
// TODO: Replace mock auction summary with an approved REST API integration.
export const auctionSummaryMock: AuctionSummary = {
  auctionId: 'AUC-984', buyer: 'Alex Nguyen', winningBid: 38800000, personalBid: 38200000,
  marketPrice: 45000000, startingPrice: 30000000, deposit: 3800000,
  endedAt: '25/10/2025 23:59:51', paymentSeconds: 23 * 3600 + 45 * 60 + 6, bidCount: 39,
};
