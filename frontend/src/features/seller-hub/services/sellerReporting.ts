import { sellerReportKpis as templates } from './sellerReports.mock';
import type { RevenuePoint, ShopReview, TopSku } from '../types/sellerHub';
// Explicit unavailable-API view data; these placeholders do not claim real revenue.
export const sellerReportKpis=templates.map(k=>({...k,value:'—',caption:'Chưa có API báo cáo'}));
export const sellerRevenueSeries:RevenuePoint[]=Array.from({length:6},(_,i)=>({label:'T'+(i+1),value:0,growth:'—'}));export const sellerReviews:ShopReview[]=[];export const sellerTopSkus:TopSku[]=[];
export const shopRating={score:'—',total:'Chưa có API đánh giá',stars:[5,4,3,2,1].map(star=>({star,percent:0}))};
export const sellerReviewKpis={replyRate:'—',replyNote:'Chưa có dữ liệu',responseNote:'Chưa có API'};

