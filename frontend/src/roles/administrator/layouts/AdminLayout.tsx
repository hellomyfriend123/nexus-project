import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';
import AdminModal from '../../../features/admin/components/AdminModal';
import '../../../features/admin/styles/admin.css';

type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (accepted: boolean) => void;
}

const TOAST_EVENT = 'nx-admin-toast';
const CONFIRM_EVENT = 'nx-admin-confirm';

export const adminNotify = {
  success(title: string, message?: string) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, { detail: { type: 'success', title, message } }),
    );
  },
  error(title: string, message?: string) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, { detail: { type: 'error', title, message } }),
    );
  },
};

export function adminConfirm(options: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent(CONFIRM_EVENT, {
        detail: { ...options, resolve },
      }),
    );
  });
}

export function AdminLayout() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const detail = (e as CustomEvent<{ type: ToastType; title: string; message?: string }>).detail;
      if (!detail) return;
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev.slice(-3), { id, ...detail }]);
      window.setTimeout(
        () => removeToast(id),
        detail.type === 'error' ? 5000 : 3200,
      );
    };

    const handleConfirm = (e: Event) => {
      const detail = (e as CustomEvent<ConfirmRequest>).detail;
      if (detail) setConfirmReq(detail);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    window.addEventListener(CONFIRM_EVENT, handleConfirm);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      window.removeEventListener(CONFIRM_EVENT, handleConfirm);
    };
  }, [removeToast]);

  const handleConfirmClose = (accepted: boolean) => {
    if (confirmReq) {
      confirmReq.resolve(accepted);
      setConfirmReq(null);
    }
  };

  return (
    <div className="nx-admin-layout">
      <AdminSidebar />
      <div className="nx-admin-main">
        <AdminTopBar />
        <main className="nx-admin-content">
          <Outlet />
        </main>
      </div>

      {/* Non-blocking Toast Notifications */}
      {toasts.length > 0 && (
        <div className="nx-toast-container" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`nx-toast nx-toast-${t.type}`}>
              <div className="nx-toast-icon">
                <i
                  className={
                    t.type === 'success'
                      ? 'bi bi-check-lg'
                      : 'bi bi-exclamation-triangle-fill'
                  }
                ></i>
              </div>
              <div className="nx-toast-content">
                <div className="nx-toast-title">{t.title}</div>
                {t.message && <div className="nx-toast-message">{t.message}</div>}
              </div>
              <button
                type="button"
                className="nx-toast-close"
                onClick={() => removeToast(t.id)}
                aria-label="Đóng thông báo"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <AdminModal
        isOpen={Boolean(confirmReq)}
        onClose={() => handleConfirmClose(false)}
        title={confirmReq?.title || 'Xác nhận thao tác'}
        maxWidth="460px"
        footer={
          <>
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              onClick={() => handleConfirmClose(false)}
            >
              Huỷ bỏ
            </button>
            <button
              type="button"
              className={`nx-btn ${confirmReq?.danger !== false ? 'nx-btn-danger' : 'nx-btn-primary'}`}
              onClick={() => handleConfirmClose(true)}
            >
              {confirmReq?.confirmLabel || 'Xác nhận'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: confirmReq?.danger !== false ? '#fef2f2' : '#eff6ff',
              color: confirmReq?.danger !== false ? '#dc2626' : '#315bf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            <i
              className={
                confirmReq?.danger !== false
                  ? 'bi bi-exclamation-triangle-fill'
                  : 'bi bi-question-circle-fill'
              }
            ></i>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
            {confirmReq?.message}
          </p>
        </div>
      </AdminModal>
    </div>
  );
}

export default AdminLayout;
