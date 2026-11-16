import { useState } from 'react';
import { getSession } from '../../../features/auth/services/auth.api';

interface SellerTopBarProps {
  onToggleSidebar?: () => void;
}

export function SellerTopBar({ onToggleSidebar }: SellerTopBarProps) {
  const session = getSession();
  const [showApiInfo, setShowApiInfo] = useState(false);

  return (
    <header className="nx-seller-topbar">
      <div className="d-flex align-items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            className="btn btn-sm btn-light border d-md-none"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation"
          >
            <i className="bi bi-list fs-5"></i>
          </button>
        )}
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
            <i className="bi bi-shield-check me-1"></i> Seller Portal v1.0
          </span>
          <span
            className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 cursor-pointer"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowApiInfo(!showApiInfo)}
            title="Nhấn để xem thông tin API"
          >
            <i className="bi bi-code-slash me-1"></i> 20 API Backend Sẵn Sàng
          </span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="d-none d-lg-flex align-items-center text-muted" style={{ fontSize: '12px' }}>
          <i className="bi bi-clock me-1"></i> Giờ hệ thống: {new Date().toLocaleDateString('vi-VN')}
        </div>

        <div className="dropdown">
          <button
            className="btn btn-sm btn-light border rounded-pill px-3 d-flex align-items-center gap-2"
            type="button"
          >
            <i className="bi bi-person-circle text-primary"></i>
            <span className="fw-medium">{session?.fullName || 'Gian hàng Seller'}</span>
            <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
              SELLER
            </span>
          </button>
        </div>
      </div>

      {showApiInfo && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-5 shadow-lg p-3 bg-white rounded-3 border"
          style={{ zIndex: 1100, maxWidth: '500px', width: '90%' }}
        >
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h6 className="m-0 fw-bold text-primary">
              <i className="bi bi-info-circle me-1"></i> Trạng thái API Seller
            </h6>
            <button
              type="button"
              className="btn-close btn-sm"
              onClick={() => setShowApiInfo(false)}
            ></button>
          </div>
          <p className="small text-muted mb-2">
            Toàn bộ 20 API nghiệp vụ của Seller từ Backend đã được thiết kế sẵn các nút tương tác tương ứng trên các trang giao diện. Khi bạn sẵn sàng, chỉ cần kết nối hàm gọi API thật!
          </p>
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setShowApiInfo(false)}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default SellerTopBar;
