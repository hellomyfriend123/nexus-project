export interface AuctionProduct {
  id: string; name: string; category: string; sku: string; image: string; price: number; images: string[]; description: string;
}
export interface AuctionDraft {
  productId: string; startingPrice: string; startDate: string; startTime: string; duration: string; startNow: boolean;
}
export interface CreateAuctionRequest { productId: string; startingPrice: number; startTime: string; endTime: string; }
