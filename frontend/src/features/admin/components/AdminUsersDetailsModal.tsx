import AdminModal from '../components/AdminModal';
import type { useAdminUsers } from '../hooks/useAdminUsers';

export function AdminUsersDetailsModal(model: ReturnType<typeof useAdminUsers>) {
  const { selectedUser, setSelectedUser, showStatusModal, setShowStatusModal } = model;
  return (
    <AdminModal
      isOpen={Boolean(selectedUser && !showStatusModal)}
      onClose={() => setSelectedUser(null)}
      title="Chi tiết tài khoản người dùng"
    >
      {selectedUser && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#315bf4',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
              }}
            >
              {selectedUser.fullName.charAt(0)}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{selectedUser.fullName}</h3>
              <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                ID: <code>{selectedUser.id}</code>
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <strong>Email:</strong> {selectedUser.email}
            </div>
            <div>
              <strong>Tên đăng nhập:</strong> {selectedUser.username || selectedUser.email}
            </div>
            <div>
              <strong>Điện thoại:</strong>{' '}
              {selectedUser.phone || selectedUser.phoneNumber ? (
                <strong style={{ color: '#16a34a' }}>
                  <i className="bi bi-telephone-fill me-1"></i>
                  {selectedUser.phone || selectedUser.phoneNumber}
                </strong>
              ) : (
                <span style={{ color: '#64748b', fontStyle: 'italic' }}>Chưa cập nhật</span>
              )}
            </div>
            <div>
              <strong>Vai trò:</strong>{' '}
              {Array.isArray(selectedUser.roles) && selectedUser.roles.length > 0 ? (
                <span style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap' }}>
                  {selectedUser.roles.map((r) => (
                    <span
                      key={r}
                      className={`nx-badge ${
                        r === 'ADMIN' || r === 'ADMINISTRATOR'
                          ? 'nx-badge-danger'
                          : r === 'SELLER'
                            ? 'nx-badge-warning'
                            : 'nx-badge-primary'
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="nx-badge nx-badge-primary">{selectedUser.role || 'BUYER'}</span>
              )}
            </div>
            <div>
              <strong>Trạng thái:</strong>{' '}
              <span
                className={`nx-badge ${
                  selectedUser.status === 'ACTIVE'
                    ? 'nx-badge-success'
                    : selectedUser.status === 'BANNED'
                      ? 'nx-badge-danger'
                      : 'nx-badge-secondary'
                }`}
              >
                {selectedUser.status}
              </span>
            </div>
            <div>
              <strong>Số CMND/CCCD:</strong> {selectedUser.identityNumber || 'Chưa cung cấp'}
            </div>
            <div>
              <strong>Ngày tạo:</strong>{' '}
              {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
            </div>
            <div>
              <strong>Cập nhật lần cuối:</strong>{' '}
              {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('vi-VN') : 'Theo hệ thống'}
            </div>
          </div>

          {selectedUser.address && (
            <div style={{ fontSize: '13px' }}>
              <strong>Địa chỉ:</strong> {selectedUser.address}
            </div>
          )}

          {selectedUser.notes && (
            <div style={{ fontSize: '13px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
              <strong>Ghi chú hệ thống:</strong> {selectedUser.notes}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              className="nx-btn nx-btn-primary"
              onClick={() => {
                setShowStatusModal(true);
              }}
            >
              Cập nhật trạng thái
            </button>
          </div>
        </div>
      )}
    </AdminModal>
  );
}
