export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  originalPrice: number;
  image: string;
  mode: 'auction' | 'buy-now';
  badge: string;
  condition: string;
  bids: number;
  rating: number;
  endsAt: string;
}
