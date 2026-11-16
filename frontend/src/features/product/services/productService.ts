import type { Product } from '../types/product';
import dimensionShifter from '../../../assets/images/cards/dimension-shifter.webp';
import kashtiraFenrir from '../../../assets/images/cards/kashtira-fenrir.webp';
import kashtiraOgre from '../../../assets/images/cards/kashtira-ogre.webp';
import kashtiraRiseheart from '../../../assets/images/cards/kashtira-riseheart.webp';
import kashtiraUnicorn from '../../../assets/images/cards/kashtira-unicorn.webp';
import redEyesDarkDragoon from '../../../assets/images/cards/Red-Eyes Dark Dragoon.webp';
import scareclawKashtira from '../../../assets/images/cards/scareclaw-kashtira.webp';
import ultimateSlayer from '../../../assets/images/cards/ultimate-slayer.webp';

// TODO: Replace auction fixtures when data integration is explicitly requested.
// Names derive from supplied asset filenames. Prices, ratings and bids are demo values,
// not verified market prices, authenticity claims or real auction activity.
const cardFixtures = [
  {
    id: 'dimension-shifter',
    name: 'Dimension Shifter',
    image: dimensionShifter,
    price: 250000,
    bids: 8,
  },
  {
    id: 'kashtira-fenrir',
    name: 'Kashtira Fenrir',
    image: kashtiraFenrir,
    price: 450000,
    bids: 12,
  },
  {
    id: 'kashtira-ogre',
    name: 'Kashtira Ogre',
    image: kashtiraOgre,
    price: 120000,
    bids: 5,
  },
  {
    id: 'kashtira-riseheart',
    name: 'Kashtira Riseheart',
    image: kashtiraRiseheart,
    price: 300000,
    bids: 9,
  },
  {
    id: 'kashtira-unicorn',
    name: 'Kashtira Unicorn',
    image: kashtiraUnicorn,
    price: 350000,
    bids: 11,
  },
  {
    id: 'red-eyes-dark-dragoon',
    name: 'Red-Eyes Dark Dragoon',
    image: redEyesDarkDragoon,
    price: 850000,
    bids: 18,
  },
  {
    id: 'scareclaw-kashtira',
    name: 'Scareclaw Kashtira',
    image: scareclawKashtira,
    price: 150000,
    bids: 6,
  },
  {
    id: 'ultimate-slayer',
    name: 'Ultimate Slayer',
    image: ultimateSlayer,
    price: 500000,
    bids: 14,
  },
];

export const products: Product[] = cardFixtures.map((card) => ({
  ...card,
  categoryId: 'trading-cards',
  originalPrice: Math.max(0, card.price - 100000),
  mode: 'auction',
  badge: 'ĐẤU GIÁ MÔ PHỎNG',
  condition: 'Thẻ bài · dữ liệu mẫu',
  rating: 0,
  endsAt: '',
}));

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
