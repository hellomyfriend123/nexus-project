/**
 * Buyer Hub (Stitch screen "Trung tâm Mua hàng & Quản lý Đấu giá").
 * UI-only types — every field is shaped after the exported design, not the API.
 */

export type BuyerHubTabId = 'auctions' | 'orders' | 'cart' | 'c2c';

export type AuctionFilterId = 'all' | 'leading' | 'outbid' | 'won';

export type OrderFilterId = 'all' | 'shipping' | 'completed' | 'cancelled';

export type BidStatus = 'outbid' | 'leading' | 'lost' | 'won';

export type OrderState = 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';

export interface BuyerProfile {
  name: string;
  /** Single letter rendered inside the avatar circle. */
  initial: string;
  verified: boolean;
  memberTier: string;
  memberId: string;
  /** Already formatted ("4.9/5") because the design fixes the precision. */
  rating: string;
  reviewCount: number | null;
  winPaymentRate: string;
  joinedAt: string;
  walletBalance: number | null;
  voucherCount: number | null;
}

export interface BuyerKpiPill {
  text: string;
  /** Bootstrap icon class, e.g. "bi-lightning-charge-fill". */
  icon?: string;
  /** Pulsing dot instead of an icon (active-bid card). */
  pulse?: boolean;
}

export interface BuyerKpi {
  id: string;
  label: string;
  value: string;
  unit: string;
  icon: string;
  iconTone: 'primary' | 'secondary' | 'highlight' | 'accent';
  valueTone: 'default' | 'secondary';
  /** Card 3 uses a secondary ring to flag the payment deadline. */
  emphasis?: boolean;
  pill?: BuyerKpiPill;
  pillTone?: 'primary' | 'secondary';
  timer?: { icon: string; prefix: string };
  caption?: { label: string; value: number };
}

export interface AuctionWinNotice {
  code: string;
  productName: string;
  finalPrice: number;
  payLabel: string;
  remainingSeconds: number;
}

export interface BidRowAction {
  /** Bootstrap icon used by the icon-only trailing button. */
  icon: string;
  /** Accessible label + tooltip of the icon button. */
  label: string;
}

export interface BuyerBid {
  id: string;
  code: string;
  title: string;
  status: BidStatus;
  thumbIcon: string;
  myBid: number;
  topBid?: number;
  topBidder?: string;
  bidCount?: number;
  /** Remaining time in seconds; ticks down client-side while the page is open. */
  countdownSeconds: number;
  actionLabel: string;
  iconAction?: BidRowAction;
  /** Ended rows only. */
  finalPrice?: number;
  endedLabel?: string;
}

export interface HubTab {
  id: BuyerHubTabId;
  label: string;
  icon: string;
  count: number;
  /** Count pill uses the secondary palette (own C2C auctions). */
  countTone?: 'default' | 'alert';
}

export interface FilterChipOption<TId extends string> {
  id: TId;
  label: string;
  count: number;
}

export interface BuyerOrder {
  id: string;
  code: string;
  tag: { text: string; tone: 'primary' | 'tertiary' };
  placedNote: string;
  status: { text: string; icon: string; tone: 'primary' | 'muted' };
  state: OrderState;
  title: string;
  meta: string;
  price: number;
  thumbIcon: string;
  thumbTone: 'primary' | 'accent';
}

export interface SavedItem {
  image?: string;
  id: string;
  name: string;
  seller: string;
  condition: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
  icon: string;
  selected: boolean;
}

export interface C2cAuction {
  code: string;
  title: string;
  startPrice: number;
  stepPrice: number;
  topBid: number;
  bidCount: number;
  remainingLabel: string;
  thumbIcon: string;
}

export interface C2cDraft {
  name: string;
  category: string;
  duration: string;
  startPrice: string;
  stepPrice: string;
  escrow: boolean;
}

export interface C2cOption {
  value: string;
  label: string;
}

export interface LiveFeedTextPart {
  text: string;
  strong?: boolean;
}

export interface LiveFeedItem {
  id: string;
  kind: 'outbid' | 'shipping' | 'seller';
  label: string;
  timeAgo: string;
  parts: LiveFeedTextPart[];
  /** Outbid alerts only. */
  actionLabel?: string;
}

export interface GuaranteeItem {
  id: string;
  icon: string;
  title: string;
  body: string;
}
