import AssuranceItem from './AssuranceItem';
import { productAssuranceConfig } from '../services/productAssurance.config';
import type { ProductAssuranceProps } from '../types/productAssurance';
import '../styles/ProductAssurance.css';

function ProductAssurance({
  items = productAssuranceConfig,
}: ProductAssuranceProps) {
  const enabledItems = items.filter((item) => item.enabled);

  if (enabledItems.length === 0) return null;

  return (
    <aside className="nx-product-assurances">
      {enabledItems.map((item) => (
        <AssuranceItem key={item.id} item={item} />
      ))}
    </aside>
  );
}

export default ProductAssurance;
