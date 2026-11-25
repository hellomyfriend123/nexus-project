export type AuctionAction = 'shipping' | 'message' | 'receipt' | 'bids' | 'support' | 'protection';
export interface AuctionDialogContent {
  title: string;
  description: string;
}

export interface ProtectionMessage {
  icon: string;
  title: string;
  description: string;
}

export interface AuctionMetric {
  label: string;
  value: string;
  caption: string;
  highlighted?: boolean;
}

export interface AuctionResult {
  id: string;
  endedAt: string;
  title: string;
  subtitle: string;
  paymentStatus: string;
  winningBid: string;
  startingPrice: string;
  bidCount: number;
  bidderCount: number | null;
  fee: string;
  shipping: string;
  net: string;
  metrics: AuctionMetric[];
  winner: {
    name: string;
    username: string;
    initials: string;
    rating: string;
    reviews: number | null;
    badge: string;
    phone: string;
    verification: string;
  };
  address: string;
  privacyNotice: string;
  packingNotice: string;
  product: {
    name: string;
    image: string;
    condition: string;
    category: string;
    sku: string;
    quantity: string;
  };
  countdown: string;
  paymentWindow: string;
  deadline: string;
  steps: {
    icon: string;
    title: string;
    description: string;
    time: string;
    state: string;
    style: 'done' | 'active' | 'pending'
  }[];
  bidPage: number;
  bidTotalPages: number;
  bids: {
    id: string;
    name: string;
    initials: string;
    amount: string;
    time: string;
    winner: boolean;
  }[];
  protection: ProtectionMessage[];
  secondChance: ProtectionMessage;
}
