import type { ReactNode } from 'react';

interface ListingSectionProps {
  step: number;
  title: string;
  caption: string;
  aside?: ReactNode;
  children: ReactNode;
}

// Khung thẻ form dùng chung cho 5 bước của trang đăng bán.
export default function ListingSection({ step, title, caption, aside, children }: ListingSectionProps) {
  return (
    <section className="nx-listing-card">
      <header className="nx-listing-card-head">
        <div className="nx-listing-card-head-main">
          <span className="nx-listing-step">{step}</span>
          <div className="nx-listing-card-head-text">
            <h2>{title}</h2>
            <p>{caption}</p>
          </div>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
