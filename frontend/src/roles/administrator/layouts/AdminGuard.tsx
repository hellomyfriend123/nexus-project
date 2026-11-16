import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  getSession,
  loginAsMockAdmin,
  saveSession,
  adminAccount,
} from '../../../features/auth/services/auth.api';

export function AdminGuard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(getSession);

  const handleLoginMockAdmin = () => {
    const adminSess = loginAsMockAdmin(true);
    setSession(adminSess);
  };

  // Case 1: No session at all -> Provide quick mock admin login or go to login page
  if (!session) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            backgroundColor: '#1e293b',
            padding: '36px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            border: '1px solid #334155',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(49, 91, 244, 0.15)',
              color: '#315bf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 20px auto',
            }}
          >
            <i className="bi bi-shield-lock-fill"></i>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            Yêu cầu Quyền Quản trị viên
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.5 }}>
            Bạn đang truy cập vào <strong>Nexus Admin Portal</strong>. Khu vực này chỉ dành cho tài khoản có vai trò <code>ADMINISTRATOR</code>.
          </p>

          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              padding: '16px',
              borderRadius: '10px',
              textAlign: 'left',
              marginBottom: '24px',
              fontSize: '13px',
            }}
          >
            <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="bi bi-info-circle-fill"></i> Tài khoản Admin giả lập (adminAccount.mock.json):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', color: '#cbd5e1' }}>
              <span>Email:</span>
              <code>{adminAccount.email}</code>
              <span>Mật khẩu:</span>
              <code>{adminAccount.password}</code>
              <span>Vai trò:</span>
              <span style={{ color: '#4ade80' }}>ADMINISTRATOR</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="nx-btn nx-btn-primary"
              style={{ justifyContent: 'center', padding: '10px 16px', fontSize: '14px' }}
              onClick={handleLoginMockAdmin}
            >
              <i className="bi bi-lightning-charge-fill me-1"></i> Đăng nhập ngay với Admin giả lập
            </button>
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              style={{ justifyContent: 'center', color: '#94a3b8', borderColor: '#475569' }}
              onClick={() => navigate('/login')}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i> Đến trang Đăng nhập thông thường
            </button>
            <a
              href="/"
              className="nx-btn nx-btn-outline"
              style={{ justifyContent: 'center', color: '#64748b', borderColor: 'transparent', fontSize: '12px' }}
            >
              ← Quay lại Sàn Nexus
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if current user has administrator role
  const isAdmin = session.roles?.some((r) =>
    ['ADMIN', 'ROLE_ADMIN', 'ADMINISTRATOR', 'ROLE_ADMINISTRATOR'].includes(
      r.toUpperCase(),
    ),
  );

  // Case 2: Authenticated as Buyer/Seller -> provide option to grant or switch to mock admin
  if (!isAdmin) {
    const handleGrantAdminMock = () => {
      const updated = {
        ...session,
        roles: [...(session.roles || []), 'ADMINISTRATOR'],
      };
      saveSession(updated, true);
      setSession(updated);
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            backgroundColor: '#1e293b',
            padding: '36px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            border: '1px solid #334155',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 20px auto',
            }}
          >
            <i className="bi bi-shield-x"></i>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            Quyền truy cập bị từ chối (403)
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.5 }}>
            Tài khoản hiện tại (<strong>{session.email}</strong>) chỉ có vai trò{' '}
            <code>{session.roles?.join(', ') || 'NONE'}</code>, chưa có quyền Quản trị viên (ADMINISTRATOR).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="nx-btn nx-btn-primary"
              style={{ justifyContent: 'center' }}
              onClick={handleGrantAdminMock}
            >
              <i className="bi bi-shield-check me-1"></i> Cấp quyền Admin cho tài khoản hiện tại
            </button>
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              style={{ justifyContent: 'center', color: '#38bdf8', borderColor: '#0284c7' }}
              onClick={handleLoginMockAdmin}
            >
              <i className="bi bi-person-fill-gear me-1"></i> Chuyển sang tài khoản Admin giả lập ({adminAccount.email})
            </button>
            <a
              href="/"
              className="nx-btn nx-btn-outline"
              style={{ justifyContent: 'center', color: '#94a3b8', borderColor: '#475569' }}
            >
              Quay lại Sàn mua sắm
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default AdminGuard;
