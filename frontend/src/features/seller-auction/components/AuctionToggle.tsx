import type { ReactNode } from 'react';
export default function AuctionToggle({ checked, onChange, title, children }: { checked: boolean; onChange: (checked: boolean) => void; title: string; children?: ReactNode }) {
  return (
    <div className="sca-toggle-row">
      <div>
        <strong>
          {title}
        </strong>
        {children && <p>
          {children}
        </p>}
      </div>
      <button type="button" className={`sca-toggle ${checked ? 'is-on' : ''}`} role="switch" aria-checked={checked} aria-label={title} onClick={() => onChange(!checked)}>
        <span />
      </button>
    </div>
  );
}
