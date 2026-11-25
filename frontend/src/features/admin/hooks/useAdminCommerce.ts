import { useState, useEffect, useCallback, useRef } from 'react';
import { adminNotify, adminConfirm } from '../../../roles/administrator/layouts/AdminLayout';
import { adminCommerceApi } from '../services/admin.service';
import { loadAllAdminPages } from '../services/adminPagination';
import type {
  OrderStatus,
  CampaignStatus,
} from '../types/admin.types';
import type { DetailedAdminOrder, DetailedAdminCampaign, DetailedAdminCoupon } from '../types/commerce.types';

export function useAdminCommerce() {
  const [activeTab, setActiveTab] = useState<'orders' | 'campaigns' | 'coupons'>('orders');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Orders State (4 tasks)
  const [orders, setOrders] = useState<DetailedAdminOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DetailedAdminOrder | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Campaigns State
  const [campaigns, setCampaigns] = useState<DetailedAdminCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<DetailedAdminCampaign | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('ALL');
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as CampaignStatus,
  });

  // Coupons State
  const [coupons, setCoupons] = useState<DetailedAdminCoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<DetailedAdminCoupon | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponStatusFilter, setCouponStatusFilter] = useState('ALL');
  const [couponCampaignFilter, setCouponCampaignFilter] = useState('ALL');
  const [couponForm, setCouponForm] = useState({
    campaignId: '',
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 10,
    minOrderAmount: 100000,
    usageLimit: '' as number | string,
    startAt: '',
    endAt: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // FETCH DATA
  const requestRevision = useRef(0);
  const detailRevision = useRef(0);

  const loadData = useCallback(async () => {
    const revision = ++requestRevision.current;
    const isCurrent = () => revision === requestRevision.current;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'orders') {
        const res = await loadAllAdminPages((pagination) => adminCommerceApi.listOrders({ status: orderStatusFilter === 'ALL' ? undefined : (orderStatusFilter as OrderStatus), ...pagination }), isCurrent);
        if (!isCurrent()) return;
        if (res && Array.isArray(res.content)) {
          setOrders(res.content as DetailedAdminOrder[]);
        } else {
          setOrders([]);
        }
      } else if (activeTab === 'campaigns') {
        const res = await loadAllAdminPages((pagination) => adminCommerceApi.listCampaigns({ status: campaignStatusFilter === 'ALL' ? undefined : (campaignStatusFilter as CampaignStatus), ...pagination }), isCurrent);
        if (!isCurrent()) return;
        if (res && Array.isArray(res.content)) {
          setCampaigns(res.content as any);
        } else {
          setCampaigns([]);
        }
      } else if (activeTab === 'coupons') {
        const [couponRes, campRes] = await Promise.allSettled([
          loadAllAdminPages((pagination) => adminCommerceApi.listDiscountCodes({ status: couponStatusFilter === 'ALL' ? undefined : couponStatusFilter,
            campaignId: couponCampaignFilter === 'ALL' ? undefined : couponCampaignFilter, ...pagination }), isCurrent),
          loadAllAdminPages((pagination) => adminCommerceApi.listCampaigns({  ...pagination }), isCurrent),
        ]);
        if (!isCurrent()) return;
        if (couponRes.status === 'rejected') throw couponRes.reason;
        if (campRes.status === 'rejected') throw campRes.reason;
        if (couponRes.status === 'fulfilled' && Array.isArray(couponRes.value?.content)) {
          setCoupons(couponRes.value.content as any);
        } else {
          setCoupons([]);
        }
        if (campRes.status === 'fulfilled' && Array.isArray(campRes.value?.content)) {
          setCampaigns(campRes.value.content as any);
        }
      }
    } catch (error) {
      if (!isCurrent()) return;
      setError(error instanceof Error ? error.message : 'Không thể tải dữ liệu.');
      if (activeTab === 'orders') setOrders([]);
      else if (activeTab === 'campaigns') setCampaigns([]);
      else if (activeTab === 'coupons') setCoupons([]);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [activeTab, orderStatusFilter, campaignStatusFilter, couponStatusFilter, couponCampaignFilter]);

  useEffect(() => {
    loadData();
    return () => { requestRevision.current += 1; detailRevision.current += 1; };
  }, [loadData]);

  // ORDER HANDLERS
  const handleViewOrderDetails = async (ord: DetailedAdminOrder) => {
    const revision = ++detailRevision.current;
    setSelectedOrder(ord);
    try {
      const fullOrder = await adminCommerceApi.getOrder(ord.id);
      if (revision !== detailRevision.current) return;
      if (fullOrder) {
        setSelectedOrder({
          ...ord,
          ...fullOrder,
          shippingAddress: (fullOrder as any).shippingAddress || ord.shippingAddress,
          itemsCount: (fullOrder as any).items?.length ?? ord.itemsCount ?? ord.itemCount,
        } as DetailedAdminOrder);
      }
    } catch (error) {
      if (revision !== detailRevision.current) return;
      setError(error instanceof Error ? error.message : 'Không thể tải chi tiết.');
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      await adminCommerceApi.updateOrderStatus(id, newStatus);
      adminNotify.success('Đã cập nhật đơn hàng', `Trạng thái mới: ${newStatus}`);
      loadData();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      adminNotify.error('Không thể đổi trạng thái đơn hàng', errorMsg);
    }
  };

  const handleCancelOrder = async (id: string) => {
    const ok = await adminConfirm({
      title: 'Xác nhận huỷ đơn hàng',
      message: 'Xác nhận huỷ đơn hàng này? Hệ thống sẽ hoàn tiền cho người mua.',
      confirmLabel: 'Huỷ đơn hàng',
      danger: true,
    });
    if (ok) {
      try {
        await adminCommerceApi.cancelOrder(id);
        adminNotify.success('Đã huỷ đơn hàng thành công');
        loadData();
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi huỷ đơn hàng từ Backend';
        adminNotify.error('Không thể huỷ đơn hàng', errorMsg);
      }
    }
  };

  // CAMPAIGN HANDLERS
  const handleOpenCreateCampaign = () => {
    detailRevision.current += 1;
    setSelectedCampaign(null);
    setCampaignForm({
      name: '',
      description: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'ACTIVE',
    });
    setShowCampaignModal(true);
  };

  const handleOpenEditCampaign = async (camp: DetailedAdminCampaign) => {
    const revision = ++detailRevision.current;
    setSelectedCampaign(camp);
    setCampaignForm({
      name: camp.name,
      description: camp.description || '',
      startDate: camp.startDate ? camp.startDate.slice(0, 10) : '',
      endDate: camp.endDate ? camp.endDate.slice(0, 10) : '',
      status: camp.status || 'ACTIVE',
    });
    setShowCampaignModal(true);
    try {
      const freshCamp = await adminCommerceApi.getCampaign(camp.id);
      if (revision !== detailRevision.current) return;
      if (freshCamp) {
        setSelectedCampaign(freshCamp as any);
        setCampaignForm({
          name: freshCamp.name,
          description: freshCamp.description || '',
          startDate: freshCamp.startDate ? String(freshCamp.startDate).slice(0, 10) : '',
          endDate: freshCamp.endDate ? String(freshCamp.endDate).slice(0, 10) : '',
          status: freshCamp.status || 'ACTIVE',
        });
      }
    } catch (error) {
      if (revision !== detailRevision.current) return;
      setError(error instanceof Error ? error.message : 'Không thể tải chi tiết.');
    }
  };

  const handleEndCampaign = async (id: string) => {
    const ok = await adminConfirm({
      title: 'Kết thúc chiến dịch khuyến mãi',
      message: 'Bạn muốn kết thúc chiến dịch khuyến mãi này? Trạng thái sẽ chuyển thành ENDED.',
      confirmLabel: 'Kết thúc chiến dịch',
      danger: true,
    });
    if (ok) {
      try {
        await adminCommerceApi.endCampaign(id);
        adminNotify.success('Đã kết thúc chiến dịch khuyến mãi');
        loadData();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi kết thúc chiến dịch từ Backend';
        adminNotify.error('Không thể kết thúc chiến dịch', errorMsg);
      }
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name.trim()) return;
    if (campaignForm.startDate && campaignForm.endDate && campaignForm.startDate > campaignForm.endDate) { setError('Ngày kết thúc phải sau ngày bắt đầu.'); return; }

    try {
      const payload: any = {
        name: campaignForm.name.trim(),
        description: campaignForm.description.trim() || undefined,
        startDate: campaignForm.startDate || undefined,
        endDate: campaignForm.endDate || undefined,
        status: campaignForm.status,
      };

      if (selectedCampaign) {
        await adminCommerceApi.updateCampaign(selectedCampaign.id, payload);
        adminNotify.success('Đã cập nhật chiến dịch khuyến mãi', campaignForm.name.trim());
      } else {
        await adminCommerceApi.createCampaign(payload);
        adminNotify.success('Đã tạo chiến dịch khuyến mãi mới', campaignForm.name.trim());
      }
      setShowCampaignModal(false);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      adminNotify.error('Không thể lưu chiến dịch', errorMsg);
    }
  };

  // COUPON HANDLERS
  const handleOpenCreateCoupon = () => {
    detailRevision.current += 1;
    setSelectedCoupon(null);
    setCouponForm({
      campaignId: couponCampaignFilter !== 'ALL' ? couponCampaignFilter : '',
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 100000,
      usageLimit: 100,
      startAt: new Date().toISOString().slice(0, 10),
      endAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: 'ACTIVE',
    });
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = async (c: DetailedAdminCoupon) => {
    const revision = ++detailRevision.current;
    setSelectedCoupon(c);
    setCouponForm({
      campaignId: c.campaignId || '',
      code: c.code,
      discountType: c.discountType || 'FIXED_AMOUNT',
      discountValue: Number(c.discountValue || 0),
      minOrderAmount: Number(c.minOrderAmount || 0),
      usageLimit: c.usageLimit !== undefined && c.usageLimit !== null ? c.usageLimit : '',
      startAt: c.startAt ? String(c.startAt).slice(0, 10) : '',
      endAt: c.endAt ? String(c.endAt).slice(0, 10) : '',
      status: c.status || 'ACTIVE',
    });
    setShowCouponModal(true);
    try {
      const freshCoupon = await adminCommerceApi.getDiscountCode(c.id);
      if (revision !== detailRevision.current) return;
      if (freshCoupon) {
        setSelectedCoupon(freshCoupon as any);
        setCouponForm({
          campaignId: (freshCoupon as any).campaignId || '',
          code: freshCoupon.code,
          discountType: (freshCoupon as any).discountType || 'FIXED_AMOUNT',
          discountValue: Number((freshCoupon as any).discountValue ?? 0),
          minOrderAmount: Number((freshCoupon as any).minOrderAmount ?? 0),
          usageLimit:
            (freshCoupon as any).usageLimit !== undefined && (freshCoupon as any).usageLimit !== null
              ? (freshCoupon as any).usageLimit
              : '',
          startAt: (freshCoupon as any).startAt ? String((freshCoupon as any).startAt).slice(0, 10) : '',
          endAt: (freshCoupon as any).endAt ? String((freshCoupon as any).endAt).slice(0, 10) : '',
          status: (freshCoupon as any).status || 'ACTIVE',
        });
      }
    } catch (error) {
      if (revision !== detailRevision.current) return;
      setError(error instanceof Error ? error.message : 'Không thể tải chi tiết.');
    }
  };

  const handleToggleCoupon = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminCommerceApi.updateDiscountCodeStatus(id, nextStatus as 'ACTIVE' | 'INACTIVE');
      adminNotify.success('Đã đổi trạng thái mã giảm giá', `Trạng thái mới: ${nextStatus}`);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi cập nhật mã giảm giá từ Backend';
      adminNotify.error('Không thể đổi trạng thái mã giảm giá', errorMsg);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    if (couponForm.discountValue <= 0 || (couponForm.discountType === 'PERCENTAGE' && couponForm.discountValue > 100) || couponForm.minOrderAmount < 0) { setError('Giá trị giảm giá hoặc đơn hàng tối thiểu không hợp lệ.'); return; }
    if (couponForm.startAt && couponForm.endAt && couponForm.startAt > couponForm.endAt) { setError('Thời gian kết thúc phải sau thời gian bắt đầu.'); return; }

    try {
      const payload: any = {
        campaignId: couponForm.campaignId || undefined,
        code: couponForm.code.trim().toUpperCase(),
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderAmount: Number(couponForm.minOrderAmount),
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : undefined,
        startAt: couponForm.startAt ? new Date(couponForm.startAt).toISOString() : undefined,
        endAt: couponForm.endAt ? new Date(couponForm.endAt + 'T23:59:59.999Z').toISOString() : undefined,
        status: couponForm.status,
      };

      if (selectedCoupon) {
        await adminCommerceApi.updateDiscountCode(selectedCoupon.id, payload);
        adminNotify.success('Đã cập nhật mã giảm giá', payload.code);
      } else {
        await adminCommerceApi.createDiscountCode(payload);
        adminNotify.success('Đã tạo mã giảm giá mới', payload.code);
      }
      setShowCouponModal(false);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      adminNotify.error('Không thể lưu mã giảm giá', errorMsg);
    }
  };

  const getCampaignName = (campaignId?: string | null) => {
    if (!campaignId) return null;
    const found = campaigns.find((c) => c.id === campaignId);
    return found ? found.name : campaignId.slice(0, 8) + '...';
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const filteredOrders = orders.filter((o) =>
    orderStatusFilter === 'ALL' ? true : o.status === orderStatusFilter,
  );

  return { activeTab, setActiveTab, error, setError, loading, setLoading, orders, setOrders, selectedOrder, setSelectedOrder, orderStatusFilter, setOrderStatusFilter, campaigns, setCampaigns, selectedCampaign, setSelectedCampaign, showCampaignModal, setShowCampaignModal, campaignStatusFilter, setCampaignStatusFilter, campaignForm, setCampaignForm, coupons, setCoupons, selectedCoupon, setSelectedCoupon, showCouponModal, setShowCouponModal, couponStatusFilter, setCouponStatusFilter, couponCampaignFilter, setCouponCampaignFilter, couponForm, setCouponForm, loadData, handleViewOrderDetails, handleUpdateOrderStatus, handleCancelOrder, handleOpenCreateCampaign, handleOpenEditCampaign, handleEndCampaign, handleSaveCampaign, handleOpenCreateCoupon, handleOpenEditCoupon, handleToggleCoupon, handleSaveCoupon, getCampaignName, formatCurrency, filteredOrders };
}
