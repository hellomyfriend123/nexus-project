import type { ComponentProps } from 'react';
import Icon from '../../../shared/components/Icon';

export interface ProductAssuranceItem {
  id: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof Icon>['name'];
  enabled: boolean;
  /** Render a visible disclaimer when the content has not been verified. */
  simulationNotice?: string;
}

export interface ProductAssuranceProps {
  /** Supply mapped service data here when Backend integration is requested. */
  items?: readonly ProductAssuranceItem[];
}
