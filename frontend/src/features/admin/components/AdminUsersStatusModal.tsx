import AdminModal from '../components/AdminModal';
import type { useAdminUsers } from '../hooks/useAdminUsers';

export function AdminUsersStatusModal(model: ReturnType<typeof useAdminUsers>) {
  const { selectedUser, showStatusModal, setShowStatusModal, targetStatus, setTargetStatus, actionLoading, handleUpdateStatus } = model;
  return (
    <AdminModal
      isOpen={showStatusModal}
      onClose={() => setShowStatusModal(false)}
      title="Cập nhật trạng thái tài khoản"
    >
      {selectedUser && (
        <div>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            Thay đổi trạng thái cho tài khoản: <strong>{selectedUser.fullName}</strong> (
            {selectedUser.email})
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                backgroundColor: targetStatus === 'ACTIVE' ? '#eff6ff' : '#fff',
              }}
            >
              <input
                type="radio"
                name="status"
                value="ACTIVE"
                checked={targetStatus === 'ACTIVE'}
                onChange={() => setTargetStatus('ACTIVE')}
              />
              <div>
                <strong style={{ color: '#059669' }}>ACTIVE (Kích hoạt)</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Người dùng có thể đăng nhập, đặt giá đấu và mua sắm bình thường.
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                backgroundColor: targetStatus === 'INACTIVE' ? '#eff6ff' : '#fff',
              }}
            >
              <input
                type="radio"
                name="status"
                value="INACTIVE"
                checked={targetStatus === 'INACTIVE'}
                onChange={() => setTargetStatus('INACTIVE')}
              />
              <div>
                <strong style={{ color: '#d97706' }}>INACTIVE (Vô hiệu hoá tạm thời)</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Tạm dừng hoạt động tài khoản cho đến khi được mở lại.
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                backgroundColor: targetStatus === 'BANNED' ? '#eff6ff' : '#fff',
              }}
            >
              <input
                type="radio"
                name="status"
                value="BANNED"
                checked={targetStatus === 'BANNED'}
                onChange={() => setTargetStatus('BANNED')}
              />
              <div>
                <strong style={{ color: '#dc2626' }}>BANNED (Khoá / Cấm tài khoản)</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Khoá do vi phạm chính sách sàn hoặc huỷ bid không thanh toán.
                </div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              disabled={actionLoading}
              onClick={() => setShowStatusModal(false)}
            >
              Huỷ bỏ
            </button>
            <button
              type="button"
              className="nx-btn nx-btn-primary"
              disabled={actionLoading}
              onClick={handleUpdateStatus}
            >
              {actionLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      )}
    </AdminModal>
  );
}
