import C2cAuctionCard from './C2cAuctionCard';
import C2cAuctionForm from './C2cAuctionForm';
import type { C2cAuction, C2cDraft, C2cOption } from '../types/buyerHub';

interface C2cTabProps {
  title: string;
  subtitle: string;
  activeLabel: string;
  formTitle: string;
  auction: C2cAuction | null;
  categories: C2cOption[];
  durations: C2cOption[];
  draft: C2cDraft;
  onViewBidders: (bidCount: number) => void;
  onEndEarly: () => void;
  onDraftChange: <K extends keyof C2cDraft>(field: K, value: C2cDraft[K]) => void;
  onReset: () => void;
  onSubmit: () => void;
}

/** Tab 4 — the buyer's own (C2C) auctions plus the inline create-auction form. */
export default function C2cTab({
  title,
  subtitle,
  activeLabel,
  formTitle,
  auction,
  categories,
  durations,
  draft,
  onViewBidders,
  onEndEarly,
  onDraftChange,
  onReset,
  onSubmit,
}: C2cTabProps) {
  return (
    <section
      className="nx-hub-panel nx-hub-panel--card nx-hub-c2c-panel"
      id="hub-panel-c2c"
      role="tabpanel"
      aria-labelledby="hub-tab-c2c"
      tabIndex={0}
    >
      <div className="nx-hub-c2c-intro">
        <h3 className="nx-hub-c2c-intro-title">{title}</h3>
        <p className="nx-hub-c2c-intro-text">{subtitle}</p>
      </div>

      {auction ? <C2cAuctionCard
        auction={auction}
        activeLabel={activeLabel}
        onViewBidders={onViewBidders}
        onEndEarly={onEndEarly}
      /> : <p className="nx-hub-empty">Backend chưa hỗ trợ phiên C2C dành cho người mua.</p>}

      <C2cAuctionForm
        title={formTitle}
        draft={draft}
        categories={categories}
        durations={durations}
        onChange={onDraftChange}
        onReset={onReset}
        onSubmit={onSubmit}
      />
    </section>
  );
}
