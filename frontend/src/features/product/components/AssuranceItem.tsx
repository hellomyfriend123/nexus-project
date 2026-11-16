import { useId } from 'react';
import Icon from '../../../shared/components/Icon';
import type { ProductAssuranceItem } from '../types/productAssurance';
import '../styles/ProductAssurance.css';

function AssuranceItem({ item }: { item: ProductAssuranceItem }) {
  const titleId = useId();

  if (!item.enabled) return null;

  return (
    <section className="nx-panel nx-assurance-item" aria-labelledby={titleId}>
      <h3 id={titleId}>
        <span className="nx-assurance-icon">
          <Icon name={item.icon} />
        </span>{' '}
        {item.title}
      </h3>
      <p>{item.description}</p>
      {item.simulationNotice && <p>{item.simulationNotice}</p>}
    </section>
  );
}

export default AssuranceItem;
