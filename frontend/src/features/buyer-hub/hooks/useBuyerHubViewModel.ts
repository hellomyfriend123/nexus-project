import { useBuyerHub } from './useBuyerHub';
import { auctionFilters, buyerKpis, hubTabs, orderFilters } from '../constants/buyerHub.constants';

/** Combine live counts with UI configuration without inventing unsupported business data. */
export function useBuyerHubViewModel() {
  const hub = useBuyerHub();
  return {
    ...hub,
    displayKpis: buyerKpis.map(kpi => ({ ...kpi, value: '—', pill: undefined, caption: undefined, timer: undefined })),
    displayTabs: hubTabs.map(tab => ({ ...tab, count: tab.id === 'cart' ? hub.savedCount : tab.id === 'orders' ? hub.orderCount : 0 })),
    displayAuctionFilters: auctionFilters.map(filter => ({ ...filter, count: 0 })),
    displayOrderFilters: orderFilters.map(filter => ({ ...filter, count: hub.orderCounts[filter.id] ?? 0 })),
  };
}
