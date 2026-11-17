import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAuctionApi } from '../services/admin.service';
import { loadAllAdminPages } from '../services/adminPagination';
import type {
  AdminAuction,
} from '../types/admin.types';


export function useAdminAuctions() {
  const [auctions, setAuctions] = useState<AdminAuction[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAuction, setSelectedAuction] = useState<AdminAuction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUsingRealApi, setIsUsingRealApi] = useState(false);

  const requestRevision = useRef(0);

  const loadAuctions = useCallback(async () => {
    const revision = ++requestRevision.current;
    const isCurrent = () => revision === requestRevision.current;
    setLoading(true);
    setError(null);
    try {
      const res = await loadAllAdminPages((pagination) => adminAuctionApi.list({ status: statusFilter === 'ALL' ? undefined : statusFilter, ...pagination }), isCurrent);
        if (!isCurrent()) return;
      if (res && Array.isArray(res.content)) {
        setAuctions(res.content);
        setIsUsingRealApi(true);
      } else {
        setAuctions([]);
      }
    } catch (error) {
      if (!isCurrent()) return;
      setError(error instanceof Error ? error.message : 'Không thể tải dữ liệu.');
      setIsUsingRealApi(false);
      setAuctions([]);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAuctions();
    return () => { requestRevision.current += 1; };
  }, [loadAuctions]);

  const handleCancelAuction = async (id: string, title?: string) => {
    if (confirm(`Bạn có chắc chắn muốn hủy phiên đấu giá "${title || id}" theo quyền Admin (FR-37)?`)) {
      try {
        await adminAuctionApi.cancel(id);
        alert('Đã hủy phiên đấu giá thành công qua REST API!');
        setSelectedAuction(null);
        loadAuctions();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
        alert(`Không thể hủy phiên đấu giá:\n${errorMsg}`);
      }
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const filteredAuctions = auctions.filter((a) =>
    statusFilter === 'ALL' ? true : a.status === statusFilter,
  );

  return { auctions, setAuctions, statusFilter, setStatusFilter, selectedAuction, setSelectedAuction, error, setError, loading, setLoading, isUsingRealApi, setIsUsingRealApi, loadAuctions, handleCancelAuction, formatCurrency, filteredAuctions };
}
