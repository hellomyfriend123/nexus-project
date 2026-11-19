import type { useAdminUsers } from '../hooks/useAdminUsers';

export function AdminUsersFilters(model: ReturnType<typeof useAdminUsers>) {
  const { users, loading, searchKeyword, setSearchKeyword, statusFilter, setStatusFilter, roleFilter, setRoleFilter } = model;
  return (
    <div className="nx-filter-bar">
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Tìm theo tên, email, SĐT..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: '260px', paddingRight: searchKeyword ? '28px' : '12px' }}
        />
        {searchKeyword && (
          <button
            type="button"
            onClick={() => setSearchKeyword('')}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: 0,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Xóa tìm kiếm"
          >
            <i className="bi bi-x-circle-fill"></i>
          </button>
        )}
      </div>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="ALL">Tất cả trạng thái</option>
        <option value="ACTIVE">ACTIVE (Hoạt động)</option>
        <option value="INACTIVE">INACTIVE (Chưa kích hoạt)</option>
        <option value="BANNED">BANNED (Bị cấm / Khoá)</option>
      </select>

      <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
        <option value="ALL">Tất cả vai trò</option>
        <option value="BUYER">BUYER (Người mua)</option>
        <option value="SELLER">SELLER (Người bán)</option>
        <option value="ADMIN">ADMIN (Quản trị viên)</option>
        <option value="ADMINISTRATOR">ADMINISTRATOR (Quản trị viên)</option>
      </select>

      <span style={{ fontSize: '13px', color: '#64748b', marginLeft: 'auto' }}>
        {loading ? 'Đang tải dữ liệu...' : `Hiển thị ${users.length} người dùng`}
      </span>
    </div>
  );
}
