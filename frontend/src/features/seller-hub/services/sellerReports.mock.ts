// Preserved design fixtures; live API data is not replaced by these values.
import type { RevenuePoint, ShopRating, ShopReview, TopSku } from '../types/sellerHub';

export const sellerReportKpis = [
  { label: 'Doanh thu 6 tháng', value: '612.400.000 đ', unit: '', caption: '+18.4% so với cùng kỳ', icon: 'cash-stack', tone: 'primary' },
  { label: 'Tỷ lệ hoàn thành đơn', value: '99.4', unit: '%', caption: '156/157 đơn giao thành công', icon: 'bag-check', tone: 'primary' },
  { label: 'Điểm đánh giá shop', value: '4.8', unit: '/5', caption: '238 đánh giá đã xác thực', icon: 'star', tone: 'danger' },
];

export const sellerRevenueSeries: RevenuePoint[] = [
  { label: 'T10', value: 78000000, growth: '+6.2%' },
  { label: 'T11', value: 92500000, growth: '+18.6%' },
  { label: 'T12', value: 118000000, growth: '+27.6%' },
  { label: 'T1', value: 104500000, growth: '-11.4%' },
  { label: 'T2', value: 120400000, growth: '+15.2%' },
  { label: 'T3', value: 142500000, growth: '+18.4%' },
];

export const sellerTopSkus: TopSku[] = [
  { id: 't1', name: 'Dell XPS 15 9530', sku: 'DELL-XPS-15', sold: '18 máy', revenue: 684000000, trend: '+12%', tone: 'up' },
  { id: 't2', name: 'Tai nghe chống ồn Sony WH-5', sku: 'SONY-WH5-SLV', sold: '45 chiếc', revenue: 305550000, trend: '+9%', tone: 'up' },
  { id: 't3', name: 'Bàn phím cơ Leopold FC900R', sku: 'LEO-900R', sold: '31 chiếc', revenue: 89900000, trend: '+4%', tone: 'up' },
  { id: 't4', name: 'Máy ảnh Canon EOS R6 Mark II', sku: 'CAM-CANON-R6M2', sold: '4 máy', revenue: 209600000, trend: '-2%', tone: 'down' },
];

export const shopRating: ShopRating = {
  score: '4.8', total: '238 đánh giá',
  stars: [{ star: 5, percent: 84 }, { star: 4, percent: 11 }, { star: 3, percent: 3 }, { star: 2, percent: 1 }, { star: 1, percent: 1 }],
};

export const sellerReviews: ShopReview[] = [
  { id: 'rv-1', buyer: 'Nguyễn Văn An', rating: 5, time: '2 giờ trước', product: 'Dell XPS 15 9530', text: 'Máy nguyên seal, shop đóng gói kỹ và giao hỏa tốc đúng 2 giờ. Rất đáng tin cậy.', replied: false },
  { id: 'rv-2', buyer: 'Trần Minh Hằng', rating: 5, time: 'Hôm qua', product: 'Canon EOS R6 Mark II', text: 'Ảnh thực tế đúng mô tả, serial khớp với giấy tờ. Shop tư vấn nhiệt tình.', replied: true },
  { id: 'rv-3', buyer: 'Lê Quốc Bảo', rating: 4, time: '3 ngày trước', product: 'Sony WH-5', text: 'Tai nghe tốt, hộp hơi móp góc nhưng shop đã giảm giá bù. Hài lòng.', replied: false },
];

export const sellerReviewKpis = { replyRate: '96.2%', replyNote: 'Phản hồi trong 5 phút', responseNote: '12 đánh giá chờ phản hồi' };
