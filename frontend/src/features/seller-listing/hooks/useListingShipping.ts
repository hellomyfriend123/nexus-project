import { useState } from 'react';
import { listingShippingMethods } from '../services/listingShipping.mock';
export function useListingShipping(){
  const [methods, setMethods] = useState<string[]>(
    listingShippingMethods.filter(item => item.enabled).map(item => item.id),
  );

  function toggleMethod(id: string) {
    setMethods(previous => (
      previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]
    ));
  }

 return {methods,toggleMethod};
}
