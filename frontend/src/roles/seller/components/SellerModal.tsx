import React, { useEffect } from 'react';

interface SellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  apiBadge?: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint: string;
  };
  children: React.ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  isSubmitting?: boolean;
}

export function SellerModal({
  isOpen,
  onClose,
  title,
  apiBadge,
  children,
  onSubmit,
  submitText = 'Xác nhận thực hiện',
  isSubmitting = false,
}: SellerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="nx-seller-modal-backdrop" onClick={onClose}>
      <div
        className="nx-seller-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="nx-seller-modal-header">
          <div>
            <h5 className="m-0 fw-bold">{title}</h5>
            {apiBadge && (
              <div className="mt-1 d-flex align-items-center gap-2">
                <span className={`nx-api-badge ${apiBadge.method.toLowerCase()}`}>
                  {apiBadge.method}
                </span>
                <span className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                  {apiBadge.endpoint}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>

        <div className="nx-seller-modal-body">{children}</div>

        <div className="nx-seller-modal-footer">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary px-3"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Đóng
          </button>
          {onSubmit && (
            <button
              type="button"
              className="btn btn-sm btn-primary px-3 d-flex align-items-center gap-2"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
              )}
              <span>{submitText}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SellerModal;
