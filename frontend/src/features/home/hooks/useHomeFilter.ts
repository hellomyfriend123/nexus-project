import { useState } from 'react';

export type HomeFilter = 'all' | 'auction' | 'buy-now';

export function useHomeFilter() {
  const [filter, setFilter] = useState<HomeFilter>('all');
  return {
    filter,
    setFilter,
    showAuctions: filter !== 'buy-now',
    showBuyNow: filter !== 'auction',
  };
}
