import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, logout } from '../../../features/auth/services/auth.api';

interface AdminTopBarProps {
  onSearch?: (query: string) => void;
  title?: string;
}

export function AdminTopBar({ onSearch, title }: AdminTopBarProps) {
  const [query, setQuery] = useState('');
  const session = getSession();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <header className="nx-admin-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {title && <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#0f172a' }}>{title}</h2>}
        <form onSubmit={handleSearch} className="nx-admin-search">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm nhanh đơn hàng, người dùng, SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '16px', fontWeight: 600 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
          Backend Nexus: Connected (Port 8080)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#315bf4',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            {session?.fullName?.charAt(0) || 'A'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{session?.fullName || 'Admin'}</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Vai trò: Administrator</span>
          </div>
          <button
            type="button"
            className="nx-btn nx-btn-outline nx-btn-sm"
            onClick={handleLogout}
            title="Đăng xuất"
            style={{ marginLeft: '6px' }}
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminTopBar;
