import React, { useEffect } from 'react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '600px',
}: AdminModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="nx-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="nx-modal-dialog"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="nx-modal-header">
          <h3 className="nx-modal-title">{title}</h3>
          <button
            type="button"
            className="nx-modal-close"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="nx-modal-body">{children}</div>

        {footer && <div className="nx-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default AdminModal;
