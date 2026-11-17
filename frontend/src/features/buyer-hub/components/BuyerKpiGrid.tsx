import BuyerKpiCard from './BuyerKpiCard';
import type { BuyerKpi } from '../types/buyerHub';

interface BuyerKpiGridProps {
  kpis: BuyerKpi[];
  timerSeconds: number;
}

export default function BuyerKpiGrid({ kpis, timerSeconds }: BuyerKpiGridProps) {
  return (
    <div className="nx-hub-kpi-grid">
      {kpis.map((kpi) => (
        <BuyerKpiCard key={kpi.id} kpi={kpi} timerSeconds={timerSeconds} />
      ))}
    </div>
  );
}
