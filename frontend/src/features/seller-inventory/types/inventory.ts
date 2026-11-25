export type ListingStatus = 'listed' | 'auction' | 'out' | 'draft' | 'serial';
export interface InventoryProduct {
  id: string; productId?: string; description?: string; images?: string[]; primaryImageUrl?: string | null; name: string; sku: string; skuName?: string; category: string; categoryId: string;
  image: string; condition: string; conditionId: string; verified?: string; photoLabel: string;
  price: number; costPrice?: number | null; oldPrice?: string; priceNote: string; priceBadge?: string;
  stock: string; sold: string; views: string; likes?: string; engagement: string;
  status: ListingStatus; visible: boolean;
}
