import type { ReactNode } from 'react';

interface OrderCardProps {
  icon: string;
  iconTone?: 'primary' | 'secondary';
  title: string;
  aside?: ReactNode;
  headSpacing?: 'normal' | 'tight';
  children: ReactNode;
}

// Khung thẻ dùng chung cho các khối thông tin của trang "Bán hàng thành công".
export default function OrderCard({
  icon,
  iconTone = 'primary',
  title,
  aside,
  headSpacing = 'normal',
  children,
}: OrderCardProps) {
  return (
    <section className="nx-success-card">
      <header className={`nx-success-card-head${headSpacing === 'tight' ? ' is-tight' : ''}`}>
        <div className="nx-success-card-head-main">
          <i className={`bi ${icon} is-${iconTone}`} aria-hidden="true" />
          <h2>{title}</h2>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
