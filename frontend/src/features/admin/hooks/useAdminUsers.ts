import { useState, useEffect, useCallback, useRef } from 'react';
import { adminUsersApi } from '../services/admin.service';
import { loadAllAdminPages } from '../services/adminPagination';
import type {
  AdminUserDetails,
  UserStatus,
} from '../types/admin.types';



import type { DetailedAdminUser } from '../types/users.types';

export function useAdminUsers() {
  const [users, setUsers] = useState<DetailedAdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<DetailedAdminUser | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<UserStatus>('ACTIVE');
  const [actionLoading, setActionLoading] = useState(false);

  // Helper tìm kiếm số điện thoại linh hoạt (hỗ trợ vài số đầu, số bất kỳ, số đầy đủ, 0xxx vs 84xxx)
  const isPhoneMatch = (userPhoneStr?: string, queryStr?: string) => {
    if (!userPhoneStr || !queryStr) return false;
    const cleanUser = userPhoneStr.replace(/\D/g, '');
    const cleanQuery = queryStr.replace(/\D/g, '');
    if (!cleanQuery) return false;
    if (cleanUser.includes(cleanQuery)) return true;
    const userNorm = cleanUser.startsWith('84') ? '0' + cleanUser.slice(2) : cleanUser;
    const queryNorm = cleanQuery.startsWith('84') ? '0' + cleanQuery.slice(2) : cleanQuery;
    return userNorm.includes(queryNorm) || cleanUser.includes(queryNorm);
  };

  // Fetch users directly from REST API and enrich details (phone, roles)
  const requestRevision = useRef(0);
  const detailRevision = useRef(0);

  const fetchUsers = useCallback(async () => {
    const revision = ++requestRevision.current;
    const isCurrent = () => revision === requestRevision.current;
    setLoading(true);
    setError(null);
    try {
      const trimmedKeyword = searchKeyword.trim();
      const hasDigits = /\d/.test(trimmedKeyword);

      // Backend UserRepository.java chỉ lọc LIKE trên email, username, fullName (KHÔNG lọc trên phone).
      // Nếu gửi từ khóa có chứa số (như SĐT) lên backend thì backend sẽ trả về mảng rỗng.
      // Do đó, khi tìm theo số điện thoại, frontend gọi toàn bộ các trang danh sách và tự lọc trên client.
      const response = await loadAllAdminPages((pagination) => adminUsersApi.list({ keyword: hasDigits ? undefined : (trimmedKeyword || undefined),
        status: statusFilter === 'ALL' ? undefined : (statusFilter as UserStatus),
        role: roleFilter === 'ALL' ? undefined : roleFilter, ...pagination }), isCurrent);
        if (!isCurrent()) return;

      if (response && Array.isArray(response.content)) {
        // Lấy chi tiết để có số điện thoại (phone), vai trò (roles) chính xác từ backend
        const enrichedList = await Promise.all(
          response.content.map(async (u) => {
            try {
              const detail = await adminUsersApi.getById(u.id);
              return {
                ...u,
                ...detail,
                phone: detail.phone || u.phone || u.phoneNumber,
                phoneNumber: detail.phone || u.phoneNumber || u.phone,
                roles: detail.roles || u.roles || (u.role ? [u.role] : []),
              };
            } catch (error) {
              if (!isCurrent()) return u;
              setError(error instanceof Error ? error.message : 'Không thể tải chi tiết người dùng.');
              return {
                ...u,
                roles: u.roles || (u.role ? [u.role] : []),
                phone: u.phone || u.phoneNumber,
              };
            }
          }),
        );

        if (!isCurrent()) return;

        // Lọc toàn diện: Tìm theo Số điện thoại (vài số đầu, số bất kỳ, số đầy đủ), họ tên, email, username
        let finalUsers = enrichedList;
        if (trimmedKeyword) {
          const lowerTerm = trimmedKeyword.toLowerCase();
          finalUsers = enrichedList.filter((u: any) => {
            const userPhone = (u.phone || u.phoneNumber || '').toString();
            const phoneMatched = isPhoneMatch(userPhone, trimmedKeyword);
            const nameMatched = (u.fullName || '').toLowerCase().includes(lowerTerm);
            const emailMatched = (u.email || '').toLowerCase().includes(lowerTerm);
            const usernameMatched = (u.username || '').toLowerCase().includes(lowerTerm);
            return phoneMatched || nameMatched || emailMatched || usernameMatched;
          });
        }

        if (!isCurrent()) return;
        setUsers(finalUsers as DetailedAdminUser[]);
      } else {
        setUsers([]);
      }
    } catch (error) {
      if (!isCurrent()) return;
      setError(error instanceof Error ? error.message : 'Không thể tải dữ liệu.');
      setUsers([]);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [searchKeyword, statusFilter, roleFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => {
      clearTimeout(debounceTimer);
      requestRevision.current += 1; detailRevision.current += 1;
    };
  }, [fetchUsers]);

  // Task U-2: View user details via API
  const handleViewDetails = async (user: DetailedAdminUser) => {
    const revision = ++detailRevision.current;
    setSelectedUser(user);
    try {
      const freshData = await adminUsersApi.getById(user.id);
      if (revision !== detailRevision.current) return;
      if (freshData) {
        setSelectedUser({
          ...user,
          ...freshData,
          phone: (freshData as any).phone || user.phone || user.phoneNumber,
          phoneNumber: (freshData as any).phone || user.phoneNumber || user.phone,
          roles: (freshData as any).roles || user.roles,
        } as DetailedAdminUser);
      }
    } catch (error) {
      if (revision !== detailRevision.current) return;
      setError(error instanceof Error ? error.message : 'Không thể tải chi tiết.');
    }
  };

  // Task U-3: Change status via API
  const handleOpenStatusModal = (user: DetailedAdminUser) => {
    detailRevision.current += 1;
    setSelectedUser(user);
    setTargetStatus(user.status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminUsersApi.updateStatus(selectedUser.id, targetStatus);
      alert(`Đã cập nhật trạng thái người dùng ${selectedUser.fullName} thành ${targetStatus}!`);
      setShowStatusModal(false);
      fetchUsers();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể hoàn tất yêu cầu';
      alert(`Không thể cập nhật trạng thái người dùng:\n${errorMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  return { users, setUsers, error, setError, loading, setLoading, searchKeyword, setSearchKeyword, statusFilter, setStatusFilter, roleFilter, setRoleFilter, selectedUser, setSelectedUser, showStatusModal, setShowStatusModal, targetStatus, setTargetStatus, actionLoading, setActionLoading, isPhoneMatch, fetchUsers, handleViewDetails, handleOpenStatusModal, handleUpdateStatus };
}
