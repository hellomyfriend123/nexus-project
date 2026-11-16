import { useId } from 'react';
import type { ReactNode } from 'react';
import './alert.css';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';
export interface AlertProps {
  children: ReactNode;
  title?: string;
  variant?: AlertVariant;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
}

/** Persistent inline feedback. Parent owns visibility through onClose. */
export default function Alert({ children, title, variant = 'info', onClose, closeLabel = 'Đóng thông báo', className = '' }: AlertProps) {
  const titleId = useId();
  return (
    <div
      className={`nx-alert nx-alert--${variant} ${className}`.trim()}
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      aria-atomic="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <span className="nx-alert__icon" aria-hidden="true">{variant === 'success' ? '✓' : variant === 'info' ? 'i' : '!'}</span>
      <div className="nx-alert__content">
        {title && <strong id={titleId} className="nx-alert__title">{title}</strong>}
        <div>{children}</div>
      </div>
      {onClose && <button className="nx-alert__close" type="button" onClick={onClose} aria-label={closeLabel}>×</button>}
    </div>
  );
}
