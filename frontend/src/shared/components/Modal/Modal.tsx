import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import './modal.css';

export type ModalSize = 'md' | 'lg';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  /** Blocks every close path (Escape, close button) while a request is in flight. */
  busy?: boolean;
  closeLabel?: string;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Dialog shell rendered inline with the native <dialog> element.
 *
 * Deliberately not portalled: seller tokens are declared on `.nx-buyer-layout.nx-seller-layout`,
 * so anything moved to document.body loses them. Inline rendering keeps the dialog inside the
 * layout scope, and showModal() still promotes it to the top layer with a ::backdrop.
 *
 * Parent owns `open`; the dialog stays mounted so focus restore and the native close event
 * always run.
 */
export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  busy = false,
  closeLabel = 'Đóng',
  footer,
  className = '',
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (dialog.open) return;
      dialog.showModal();
      // Prefer the first control in the body; fall back to the dialog itself so focus
      // never escapes to the page behind the backdrop.
      const firstControl = dialog.querySelector<HTMLElement>(
        '.nx-modal__body input:not([type="hidden"]), .nx-modal__body select, .nx-modal__body textarea, .nx-modal__body button',
      );
      (firstControl ?? dialog).focus();
      return;
    }
    if (dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`nx-modal nx-modal--${size} ${className}`.trim()}
      aria-labelledby={titleId}
      onCancel={event => {
        // Escape would otherwise close the dialog behind React's back and drop drafts.
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="nx-modal__surface">
        <header className="nx-modal__header">
          <h2 id={titleId} className="nx-modal__title">{title}</h2>
          <button
            type="button"
            className="nx-modal__close"
            aria-label={closeLabel}
            disabled={busy}
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="nx-modal__body">{children}</div>
        {footer && <footer className="nx-modal__footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
