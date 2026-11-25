export type Outcome = 'winner' | 'loser';
export interface AuctionProduct { id: string; title: string; image: string; seller: string; condition: string; location: string; shipping: string }
export interface AuctionSummary { auctionId: string; buyer: string; winningBid: number; personalBid: number | null; marketPrice: number; startingPrice: number; deposit: number | null; endedAt: string; paymentSeconds: number; bidCount: number }
export interface Bid { id: string; bidder: string; amount: number; time: string; own?: boolean; winner?: boolean }
export interface Recommendation { id: string; brand: string; title: string; image: string; price: number; badge: string; bids: string; buyNow?: boolean }
export interface JourneyStep { title: string; description: string; state: 'done' | 'active' | 'pending' }
export interface Settlement { orderId?: string | null; orderStatus?: string; winnerId?: string | null; status?: string; refundReference: string; refundedAt: string; wallet: string; paymentMethods: string[]; escrowBenefits: string[]; steps: JourneyStep[] }
export interface AuctionResult { summary: AuctionSummary; product: AuctionProduct; bids: Bid[]; recommendations: Recommendation[]; settlement: Settlement }
