import { useState, useEffect, useCallback, useRef } from 'react';
import { adminNotify, adminConfirm } from '../../../roles/administrator/layouts/AdminLayout';
import { adminAuctionApi } from '../services/admin.service';
import { adminCatalogApi, adminUsersApi } from '../../../services/api/adminApi';
import { loadAllAdminPages } from '../services/adminPagination';
import type { AdminAuction, AdminBid } from '../types/admin.types';

export interface AuctionBidView extends Partial<AdminBid> {
  id: string;
  auctionId?: string;
  bidderId?: string;
  amount: number;
  status?: string;
  placedAt?: string;
}

export interface AuctionItemView extends Omit<AdminAuction, 'bids'> {
  productId?: string;
  sellerId?: string;
  currentPrice?: number;
  highestBidderId?: string;
  bidCount?: number;
  acceptedBidCount?: number;
  bids?: AuctionBidView[];
}

export interface AuctionUserLookup {
  fullName: string;
  email: string;
}

export function useAdminAuctions() {
  const [auctions, setAuctions] = useState<AuctionItemView[]>([]);
  const [userMap, setUserMap] = useState<Record<string, AuctionUserLookup>>({});
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [selectedAuction, setSelectedAuction] = useState<AuctionItemView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestRevision = useRef(0);

  const loadAuctions = useCallback(async () => {
    const revision = ++requestRevision.current;
    const isCurrent = () => revision === requestRevision.current;
    setLoading(true);
    setError(null);
    try {
      const [auctionResult, usersResult, productsResult] = await Promise.allSettled([
        loadAllAdminPages(
          (pagination) =>
            adminAuctionApi.list({
              status: statusFilter === 'ALL' ? undefined : statusFilter,
              ...pagination,
            }),
          isCurrent,
        ),
        adminUsersApi.list({ size: 200 }),
        adminCatalogApi.listProducts({ size: 200, includeDeleted: true }),
      ]);

      if (!isCurrent()) return;

      if (auctionResult.status === 'rejected') {
        throw auctionResult.reason;
      }

      const nextUserMap: Record<string, AuctionUserLookup> = {};
      if (usersResult.status === 'fulfilled' && Array.isArray(usersResult.value?.content)) {
        for (const u of usersResult.value.content) {
          nextUserMap[u.id] = {
            fullName: u.fullName || u.username || u.email,
            email: u.email,
          };
        }
      }

      const nextProductMap: Record<string, string> = {};
      if (productsResult.status === 'fulfilled' && Array.isArray(productsResult.value?.content)) {
        for (const p of productsResult.value.content) {
          nextProductMap[p.id] = p.name;
        }
      }

      const res = auctionResult.value;
      if (res && Array.isArray(res.content)) {
        const list = res.content as unknown as AuctionItemView[];

        const missingIds = new Set<string>();
        for (const auc of list) {
          if (auc.sellerId && !nextUserMap[auc.sellerId]) missingIds.add(auc.sellerId);
          if (auc.highestBidderId && !nextUserMap[auc.highestBidderId]) {
            missingIds.add(auc.highestBidderId);
          }
          for (const b of auc.bids || []) {
            if (b.bidderId && !nextUserMap[b.bidderId]) missingIds.add(b.bidderId);
          }
        }

        if (missingIds.size > 0) {
          const extraUsers = await Promise.allSettled(
            Array.from(missingIds).map((uid) => adminUsersApi.getById(uid)),
          );
          if (!isCurrent()) return;
          extraUsers.forEach((extra) => {
            if (extra.status === 'fulfilled' && extra.value) {
              nextUserMap[extra.value.id] = {
                fullName: extra.value.fullName || extra.value.username || extra.value.email,
                email: extra.value.email,
              };
            }
          });
        }

        setUserMap(nextUserMap);
        setProductMap(nextProductMap);
        setAuctions(list);
      } else {
        setAuctions([]);
      }
    } catch (err) {
      if (!isCurrent()) return;
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
      setAuctions([]);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAuctions();
    return () => {
      requestRevision.current += 1;
    };
  }, [loadAuctions]);

  const handleCancelAuction = async (id: string, title?: string) => {
    const ok = await adminConfirm({
      title: 'Xác nhận hủy phiên đấu giá',
      message: `Bạn có chắc chắn muốn hủy phiên đấu giá "${title || id}"?`,
      confirmLabel: 'Hủy phiên đấu giá',
      danger: true,
    });
    if (ok) {
      try {
        await adminAuctionApi.cancel(id);
        adminNotify.success('Đã hủy phiên đấu giá', title || id);
        setSelectedAuction(null);
        loadAuctions();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
        adminNotify.error('Không thể hủy phiên đấu giá', errorMsg);
      }
    }
  };

  const formatCurrency = (val?: number | null) => {
    const num = typeof val === 'number' && Number.isFinite(val) ? val : 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const resolveProductName = (auc: AuctionItemView) => {
    if (auc.productId && productMap[auc.productId]) return productMap[auc.productId];
    if (auc.title && auc.title !== auc.productId) return auc.title;
    if (auc.productName && auc.productName !== auc.productId) return auc.productName;
    if (auc.productId) return `Sản phẩm #${auc.productId.slice(0, 8)}`;
    return `Phiên #${auc.id.slice(0, 8)}`;
  };

  const resolveUser = (
    userId?: string,
    fallbackName?: string,
    fallbackEmail?: string,
  ): AuctionUserLookup | null => {
    if (userId && userMap[userId]) return userMap[userId];
    if (fallbackName && fallbackName !== userId) {
      return { fullName: fallbackName, email: fallbackEmail || '' };
    }
    if (fallbackEmail) {
      return { fullName: fallbackEmail, email: fallbackEmail };
    }
    if (userId) {
      return { fullName: `ID: ${userId.slice(0, 8)}...`, email: '' };
    }
    return null;
  };

  const getCurrentPrice = (auc: AuctionItemView) => {
    if (typeof auc.currentPrice === 'number') return auc.currentPrice;
    if (typeof auc.currentBid === 'number') return auc.currentBid;
    if (auc.bids && auc.bids.length > 0) {
      return Math.max(...auc.bids.map((b) => b.amount || 0));
    }
    return auc.startingPrice ?? 0;
  };

  const getBidCount = (auc: AuctionItemView) =>
    auc.bidCount ?? auc.totalBids ?? auc.bids?.length ?? 0;

  const getHighestBidder = (auc: AuctionItemView) => {
    const topBid = auc.bids && auc.bids.length > 0 ? auc.bids[0] : undefined;
    const bidderId = auc.highestBidderId || topBid?.bidderId;
    if (!bidderId && !topBid?.bidderName && !topBid?.bidderEmail) return null;
    return resolveUser(bidderId, topBid?.bidderName, topBid?.bidderEmail);
  };

  const q = keyword.trim().toLowerCase();
  const filteredAuctions = auctions.filter((a) => {
    const matchStatus = statusFilter === 'ALL' ? true : a.status === statusFilter;
    if (!matchStatus) return false;
    if (!q) return true;
    const prodName = resolveProductName(a).toLowerCase();
    const seller = resolveUser(a.sellerId, a.sellerName)?.fullName.toLowerCase() || '';
    const bidder = getHighestBidder(a)?.fullName.toLowerCase() || '';
    return (
      prodName.includes(q) ||
      a.id.toLowerCase().includes(q) ||
      seller.includes(q) ||
      bidder.includes(q)
    );
  });

  const summary = {
    total: auctions.length,
    active: auctions.filter((a) => a.status === 'ACTIVE').length,
    ended: auctions.filter((a) => a.status === 'ENDED').length,
    totalBids: auctions.reduce((sum, a) => sum + getBidCount(a), 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { cls: 'nx-badge-danger', label: 'Đang diễn ra' };
      case 'SCHEDULED':
      case 'UPCOMING':
        return { cls: 'nx-badge-primary', label: 'Sắp diễn ra' };
      case 'ENDED':
        return { cls: 'nx-badge-success', label: 'Đã kết thúc' };
      case 'CANCELLED':
        return { cls: 'nx-badge-secondary', label: 'Đã huỷ' };
      default:
        return { cls: 'nx-badge-secondary', label: status };
    }
  };

  return {
    auctions,
    setAuctions,
    statusFilter,
    setStatusFilter,
    keyword,
    setKeyword,
    selectedAuction,
    setSelectedAuction,
    error,
    setError,
    loading,
    setLoading,
    loadAuctions,
    handleCancelAuction,
    formatCurrency,
    filteredAuctions,
    summary,
    resolveProductName,
    resolveUser,
    getCurrentPrice,
    getBidCount,
    getHighestBidder,
    getStatusBadge,
  };
}
