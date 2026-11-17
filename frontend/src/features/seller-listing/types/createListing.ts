// View and form contracts for creating seller listings.
export interface ListingConditionOption {
  id: string;
  title: string;
  caption: string;
}

export interface ListingMediaSlot {
  id: string;
  label: string;
  image: string;
  /** Original selected file, when the slot represents a local upload. */
  file?: File;
  cover?: boolean;
  serialVerified?: boolean;
}

export interface ListingSaleMode {
  id: string;
  title: string;
  badge: string;
  badgeTone: 'primary' | 'tertiary' | 'secondary';
  caption: string;
  enabled: boolean;
}

export interface ListingShippingMethod {
  id: string;
  title: string;
  badge?: string;
  caption: string;
  fee: string;
  enabled: boolean;
}

export interface ListingQualityItem {
  id: string;
  label: string;
  points: string;
  done: boolean;
}

export interface ListingDraftForm {
  title: string;
  brand: string;
  sku: string;
  shutter: string;
  warranty: string;
  origin: string;
  description: string;
  quantity: number;
  weight: string;
  length: string;
  width: string;
  height: string;
  price: number;
  dealPrice: number;
  minOffer: number;
}
