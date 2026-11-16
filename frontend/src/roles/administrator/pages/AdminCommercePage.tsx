import { useState, useEffect, useCallback } from 'react';
import AdminModal from '../components/AdminModal';
import { adminCommerceApi } from '../../../services/api/adminApi';
import type {
  AdminOrder,
  AdminCampaign,
  AdminCoupon,
  OrderStatus,
  CampaignStatus,
  CouponStatus,
} from '../../../features/admin/types/admin.types';

export interface OrderItemDetail {
  id?: string;
  productId?: string;
  skuId?: string;
  sellerId?: string;
  productNameSnapshot: string;
  skuCodeSnapshot: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface DetailedAdminOrder {
  id: string;
  orderNumber: string;
  buyerId?: string;
  sellerId?: string;
  orderType?: string;
  status: OrderStatus;
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  totalAmount: number;
  shippingAddress?: string;
  receiverName?: string;
  receiverPhone?: string;
  discountCode?: string;
  items?: OrderItemDetail[];
  itemCount?: number;
  itemsCount?: number;
  createdAt: string;
  updatedAt?: string;
  buyerName?: string;
  buyerEmail?: string;
  paymentMethod?: string;
  paymentStatus?: 'PAID' | 'UNPAID' | 'REFUNDED';
}

export interface DetailedAdminCampaign {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: CampaignStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface DetailedAdminCoupon {
  id: string;
  campaignId?: string | null;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount: number;
  usageLimit?: number | null;
  usedCount: number;
  startAt?: string | null;
  endAt?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export function AdminCommercePage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'campaigns' | 'coupons'>('orders');
  const [loading, setLoading] = useState(false);
  const [isUsingRealApi, setIsUsingRealApi] = useState(false);

  // Orders State (4 tasks)
  const [orders, setOrders] = useState<DetailedAdminOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DetailedAdminOrder | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Campaigns State (FR-46, FR-58)
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

  // Coupons State (FR-47, FR-58)
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
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const res = await adminCommerceApi.listOrders({
          status: orderStatusFilter === 'ALL' ? undefined : (orderStatusFilter as OrderStatus),
        });
        if (res && Array.isArray(res.content)) {
          setOrders(res.content as DetailedAdminOrder[]);
          setIsUsingRealApi(true);
        } else {
          setOrders([]);
        }
      } else if (activeTab === 'campaigns') {
        const res = await adminCommerceApi.listCampaigns({
          status: campaignStatusFilter === 'ALL' ? undefined : (campaignStatusFilter as CampaignStatus),
        });
        if (res && Array.isArray(res.content)) {
          setCampaigns(res.content as any);
          setIsUsingRealApi(true);
        } else {
          setCampaigns([]);
        }
      } else if (activeTab === 'coupons') {
        const [couponRes, campRes] = await Promise.allSettled([
          adminCommerceApi.listDiscountCodes({
            status: couponStatusFilter === 'ALL' ? undefined : couponStatusFilter,
            campaignId: couponCampaignFilter === 'ALL' ? undefined : couponCampaignFilter,
          }),
          adminCommerceApi.listCampaigns({ size: 100 }),
        ]);
        if (couponRes.status === 'fulfilled' && Array.isArray(couponRes.value?.content)) {
          setCoupons(couponRes.value.content as any);
          setIsUsingRealApi(true);
        } else {
          setCoupons([]);
        }
        if (campRes.status === 'fulfilled' && Array.isArray(campRes.value?.content)) {
          setCampaigns(campRes.value.content as any);
        }
      }
    } catch {
      setIsUsingRealApi(false);
      if (activeTab === 'orders') setOrders([]);
      else if (activeTab === 'campaigns') setCampaigns([]);
      else if (activeTab === 'coupons') setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, orderStatusFilter, campaignStatusFilter, couponStatusFilter, couponCampaignFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ORDER HANDLERS
  const handleViewOrderDetails = async (ord: DetailedAdminOrder) => {
    setSelectedOrder(ord);
    try {
      const fullOrder = await adminCommerceApi.getOrder(ord.id);
      if (fullOrder) {
        setSelectedOrder({
          ...ord,
          ...fullOrder,
          shippingAddress: (fullOrder as any).shippingAddress || ord.shippingAddress,
          itemsCount: (fullOrder as any).items?.length ?? ord.itemsCount ?? ord.itemCount,
        } as DetailedAdminOrder);
      }
    } catch {
      // Giữ thông tin đơn hàng hiện tại
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      await adminCommerceApi.updateOrderStatus(id, newStatus);
      alert(`Đã cập nhật trạng thái đơn hàng #${id} thành ${newStatus}!`);
      loadData();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể đổi trạng thái đơn hàng:\n${errorMsg}`);
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (confirm('Xác nhận huỷ đơn hàng này? Hệ thống sẽ hoàn tiền cho người mua.')) {
      try {
        await adminCommerceApi.cancelOrder(id);
        alert(`Đã huỷ đơn hàng #${id} qua REST API!`);
        loadData();
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi huỷ đơn hàng từ Backend';
        alert(`Không thể huỷ đơn hàng:\n${errorMsg}`);
      }
    }
  };

  // CAMPAIGN HANDLERS (FR-46, FR-58)
  const handleOpenCreateCampaign = () => {
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
    } catch {
      // Giữ thông tin hiện tại nếu lỗi gọi API chi tiết
    }
  };

  const handleEndCampaign = async (id: string) => {
    if (confirm('Bạn muốn kết thúc chiến dịch khuyến mãi này? Trạng thái sẽ chuyển thành ENDED.')) {
      try {
        await adminCommerceApi.endCampaign(id);
        alert('Đã kết thúc chiến dịch khuyến mãi qua REST API!');
        loadData();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi kết thúc chiến dịch từ Backend';
        alert(`Không thể kết thúc chiến dịch:\n${errorMsg}`);
      }
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name.trim()) return;

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
        alert('Đã cập nhật chiến dịch khuyến mãi thành công qua REST API!');
      } else {
        await adminCommerceApi.createCampaign(payload);
        alert('Đã tạo chiến dịch khuyến mãi mới qua REST API!');
      }
      setShowCampaignModal(false);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể lưu chiến dịch:\n${errorMsg}`);
    }
  };

  // COUPON HANDLERS (FR-47, FR-58)
  const handleOpenCreateCoupon = () => {
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
    } catch {
      // Giữ thông tin hiện tại
    }
  };

  const handleToggleCoupon = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminCommerceApi.updateDiscountCodeStatus(id, nextStatus as 'ACTIVE' | 'INACTIVE');
      alert(`Đã chuyển trạng thái mã giảm giá sang ${nextStatus} qua REST API!`);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi cập nhật mã giảm giá từ Backend';
      alert(`Không thể đổi trạng thái mã giảm giá:\n${errorMsg}`);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;

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
        alert('Đã cập nhật mã giảm giá thành công qua REST API!');
      } else {
        await adminCommerceApi.createDiscountCode(payload);
        alert('Đã tạo mã giảm giá mới qua REST API!');
      }
      setShowCouponModal(false);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      alert(`Không thể lưu mã giảm giá:\n${errorMsg}`);
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

  return (
    <div>
      <div className="nx-page-header">
        <div>
          <h1 className="nx-page-title">Quản trị Commerce (FR-25, 46, 47, 56, 58)</h1>
          <p className="nx-page-subtitle">
            Kết nối REST API: <code>/api/v1/admin/commerce/*</code>
            <span
              style={{
                marginLeft: '8px',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: isUsingRealApi ? '#ecfdf5' : '#fef3c7',
                color: isUsingRealApi ? '#059669' : '#d97706',
                fontWeight: 600,
              }}
            >
              {isUsingRealApi ? '● Live REST API' : '○ Lỗi kết nối API'}
            </span>
          </p>
        </div>
        <button
          type="button"
          className="nx-btn nx-btn-outline"
          onClick={() => loadData()}
          disabled={loading}
        >
          <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Làm mới
        </button>
      </div>

      <div className="nx-tabs">
        <button
          type="button"
          className={`nx-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <i className="bi bi-receipt me-1"></i> Đơn hàng (FR-25, 56)
        </button>
        <button
          type="button"
          className={`nx-tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          <i className="bi bi-megaphone me-1"></i> Chiến dịch khuyến mãi (FR-46, 58)
        </button>
        <button
          type="button"
          className={`nx-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          <i className="bi bi-ticket-perforated me-1"></i> Mã giảm giá & Voucher (FR-47, 58)
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="nx-admin-card">
          <div className="nx-filter-bar">
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái đơn hàng</option>
              <option value="PENDING">PENDING (Chờ xác nhận)</option>
              <option value="CONFIRMED">CONFIRMED (Đã xác nhận)</option>
              <option value="SHIPPING">SHIPPING (Đang giao hàng)</option>
              <option value="DELIVERED">DELIVERED (Giao thành công)</option>
              <option value="CANCELLED">CANCELLED (Đã huỷ)</option>
            </select>
          </div>

          <div className="nx-table-container">
            <table className="nx-admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Người mua (Buyer)</th>
                  <th>Người bán (Seller)</th>
                  <th>Phân loại</th>
                  <th>Số lượng</th>
                  <th>Tổng thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Ngày đặt</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                      Không tìm thấy đơn hàng nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <strong style={{ color: '#315bf4' }}>{ord.orderNumber}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{ord.receiverName || ord.buyerName || 'Khách mua'}</strong>
                        </div>
                        {ord.buyerId && (
                          <small
                            style={{ color: '#64748b', fontFamily: 'monospace' }}
                            title={`Buyer UUID: ${ord.buyerId}`}
                          >
                            ID: {ord.buyerId.slice(0, 8)}...
                          </small>
                        )}
                        {ord.receiverPhone && (
                          <div style={{ fontSize: '11px', color: '#16a34a' }}>
                            <i className="bi bi-telephone me-1"></i>
                            {ord.receiverPhone}
                          </div>
                        )}
                      </td>
                      <td>
                        {ord.sellerId ? (
                          <span
                            className="nx-badge nx-badge-secondary"
                            title={`Seller UUID: ${ord.sellerId}`}
                            style={{ fontFamily: 'monospace', fontSize: '11px' }}
                          >
                            <i className="bi bi-shop me-1"></i>
                            {ord.sellerId.slice(0, 8)}...
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className="nx-badge nx-badge-secondary">
                          {ord.orderType || 'REGULAR'}
                        </span>
                      </td>
                      <td>
                        <strong>{ord.itemCount ?? ord.itemsCount ?? 1}</strong> món
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        {formatCurrency(ord.totalAmount)}
                      </td>
                      <td>
                        <span
                          className={`nx-badge ${
                            ord.status === 'COMPLETED' || ord.status === 'DELIVERED'
                              ? 'nx-badge-success'
                              : ord.status === 'SHIPPING'
                                ? 'nx-badge-primary'
                                : ord.status === 'CANCELLED'
                                  ? 'nx-badge-danger'
                                  : 'nx-badge-warning'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td>{new Date(ord.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="nx-btn nx-btn-outline nx-btn-sm"
                            onClick={() => handleViewOrderDetails(ord)}
                            title="Xem chi tiết đơn hàng (GET /api/v1/admin/commerce/orders/{id})"
                          >
                            <i className="bi bi-eye"></i> Xem
                          </button>
                          {ord.status !== 'CANCELLED' && ord.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              className="nx-btn nx-btn-danger nx-btn-sm"
                              onClick={() => handleCancelOrder(ord.id)}
                              title="Huỷ đơn hàng (POST /api/v1/admin/commerce/orders/{id}/cancel)"
                            >
                              <i className="bi bi-x-circle"></i> Huỷ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="nx-admin-card">
          <div className="nx-admin-card-header">
            <div>
              <h2 className="nx-admin-card-title">Chiến dịch khuyến mãi toàn sàn (Marketing Campaigns)</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                Khung chương trình marketing tổng thể theo mùa/sự kiện (FR-46, FR-58). Mỗi chiến dịch có thể chứa nhiều Mã giảm giá (Vouchers) trực thuộc.
              </p>
            </div>
            <button
              type="button"
              className="nx-btn nx-btn-primary nx-btn-sm"
              onClick={handleOpenCreateCampaign}
            >
              <i className="bi bi-plus-lg"></i> Tạo chiến dịch mới
            </button>
          </div>

          <div className="nx-filter-bar">
            <select
              value={campaignStatusFilter}
              onChange={(e) => setCampaignStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái chiến dịch</option>
              <option value="ACTIVE">ACTIVE (Đang diễn ra)</option>
              <option value="DRAFT">DRAFT (Bản nháp)</option>
              <option value="ENDED">ENDED (Đã kết thúc)</option>
            </select>
          </div>

          <div className="nx-table-container">
            <table className="nx-admin-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Tên chiến dịch</th>
                  <th style={{ width: '35%' }}>Mô tả</th>
                  <th>Thời gian diễn ra</th>
                  <th>Trạng thái</th>
                  <th>Mã giảm giá trực thuộc</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      <i className="bi bi-megaphone" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                      Chưa có chiến dịch khuyến mãi nào. Bấm &quot;Tạo chiến dịch mới&quot; để thiết lập chương trình.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.id}>
                      <td>
                        <strong style={{ color: '#1e293b', fontSize: '14px' }}>{camp.name}</strong>
                      </td>
                      <td style={{ color: '#475569', fontSize: '12.5px', lineHeight: 1.4 }}>
                        {camp.description || <em style={{ color: '#94a3b8' }}>Không có mô tả</em>}
                      </td>
                      <td style={{ fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                        <div>
                          <i className="bi bi-calendar-event me-1 text-primary"></i>
                          {camp.startDate ? new Date(camp.startDate).toLocaleDateString('vi-VN') : 'Bắt đầu'}
                        </div>
                        <div style={{ color: '#64748b' }}>
                          → {camp.endDate ? new Date(camp.endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`nx-badge ${
                            camp.status === 'ACTIVE'
                              ? 'nx-badge-success'
                              : camp.status === 'DRAFT'
                                ? 'nx-badge-warning'
                                : 'nx-badge-secondary'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="nx-btn nx-btn-outline nx-btn-sm"
                          style={{ fontSize: '11.5px', padding: '3px 8px' }}
                          onClick={() => {
                            setCouponCampaignFilter(camp.id);
                            setActiveTab('coupons');
                          }}
                          title="Lọc các mã giảm giá thuộc chiến dịch này"
                        >
                          <i className="bi bi-ticket-detailed me-1 text-primary"></i>
                          Xem mã giảm giá
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="nx-btn nx-btn-outline nx-btn-sm"
                            onClick={() => handleOpenEditCampaign(camp)}
                            title="Chỉnh sửa chiến dịch (PUT /api/v1/admin/commerce/campaigns/{id})"
                          >
                            <i className="bi bi-pencil"></i> Sửa
                          </button>
                          {camp.status !== 'ENDED' && (
                            <button
                              type="button"
                              className="nx-btn nx-btn-danger nx-btn-sm"
                              onClick={() => handleEndCampaign(camp.id)}
                              title="Kết thúc chiến dịch (DELETE /api/v1/admin/commerce/campaigns/{id})"
                            >
                              <i className="bi bi-stop-circle"></i> Kết thúc
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="nx-admin-card">
          <div className="nx-admin-card-header">
            <div>
              <h2 className="nx-admin-card-title">Quản lý Voucher & Mã giảm giá (Discount Codes)</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                Mã giảm giá cụ thể người mua nhập khi đặt hàng (FR-47, FR-58). Có thể trực thuộc một Chiến dịch hoặc áp dụng độc lập toàn sàn.
              </p>
            </div>
            <button
              type="button"
              className="nx-btn nx-btn-primary nx-btn-sm"
              onClick={handleOpenCreateCoupon}
            >
              <i className="bi bi-plus-lg"></i> Thêm mã giảm giá
            </button>
          </div>

          <div className="nx-filter-bar">
            <select
              value={couponStatusFilter}
              onChange={(e) => setCouponStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái voucher</option>
              <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
              <option value="INACTIVE">INACTIVE (Đã vô hiệu)</option>
            </select>

            <select
              value={couponCampaignFilter}
              onChange={(e) => setCouponCampaignFilter(e.target.value)}
            >
              <option value="ALL">Tất cả chiến dịch</option>
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  Chiến dịch: {camp.name}
                </option>
              ))}
            </select>
            {couponCampaignFilter !== 'ALL' && (
              <button
                type="button"
                className="nx-btn nx-btn-outline nx-btn-sm"
                onClick={() => setCouponCampaignFilter('ALL')}
              >
                <i className="bi bi-x-circle me-1"></i> Bỏ lọc chiến dịch
              </button>
            )}
          </div>

          <div className="nx-table-container">
            <table className="nx-admin-table">
              <thead>
                <tr>
                  <th>Mã Voucher (Code)</th>
                  <th>Thuộc Chiến dịch</th>
                  <th>Mức giảm giá</th>
                  <th>Đơn tối thiểu</th>
                  <th>Đã dùng / Giới hạn</th>
                  <th>Thời hạn</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      <i className="bi bi-ticket-perforated" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                      Không tìm thấy mã giảm giá nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <code
                          style={{
                            fontSize: '13px',
                            color: '#315bf4',
                            fontWeight: 700,
                            padding: '3px 8px',
                            background: '#eff6ff',
                            borderRadius: '4px',
                          }}
                        >
                          {c.code}
                        </code>
                      </td>
                      <td>
                        {c.campaignId ? (
                          <span className="nx-badge nx-badge-primary" title={`Campaign ID: ${c.campaignId}`}>
                            <i className="bi bi-megaphone me-1"></i>
                            {getCampaignName(c.campaignId)}
                          </span>
                        ) : (
                          <span className="nx-badge nx-badge-secondary">Toàn sàn (Độc lập)</span>
                        )}
                      </td>
                      <td>
                        {c.discountType === 'PERCENTAGE' ? (
                          <span className="nx-badge nx-badge-warning" style={{ fontWeight: 700 }}>
                            -{c.discountValue}%
                          </span>
                        ) : (
                          <span className="nx-badge nx-badge-success" style={{ fontWeight: 700 }}>
                            -{formatCurrency(c.discountValue)}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(c.minOrderAmount)}</td>
                      <td>
                        <strong>{c.usedCount}</strong> /{' '}
                        {c.usageLimit !== undefined && c.usageLimit !== null ? c.usageLimit : '∞'} lượt
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {c.endAt ? new Date(c.endAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                      </td>
                      <td>
                        <span
                          className={`nx-badge ${
                            c.status === 'ACTIVE' ? 'nx-badge-success' : 'nx-badge-secondary'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="nx-btn nx-btn-outline nx-btn-sm"
                            onClick={() => handleOpenEditCoupon(c)}
                            title="Chỉnh sửa mã giảm giá (PUT /api/v1/admin/commerce/discount-codes/{id})"
                          >
                            <i className="bi bi-pencil"></i> Sửa
                          </button>
                          <button
                            type="button"
                            className="nx-btn nx-btn-outline nx-btn-sm"
                            onClick={() => handleToggleCoupon(c.id, c.status)}
                            title="Bật/Tắt trạng thái (PATCH /api/v1/admin/commerce/discount-codes/{id}/status)"
                          >
                            <i className="bi bi-toggle-on"></i> {c.status === 'ACTIVE' ? 'Tắt' : 'Bật'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <AdminModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Chi tiết đơn hàng #${selectedOrder?.orderNumber}`}
        maxWidth="780px"
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            {/* Header info bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#315bf4' }}>
                  #{selectedOrder.orderNumber}
                </span>
                <span className="nx-badge nx-badge-secondary">
                  {selectedOrder.orderType || 'REGULAR'}
                </span>
                <span
                  className={`nx-badge ${
                    selectedOrder.status === 'COMPLETED' || selectedOrder.status === 'DELIVERED'
                      ? 'nx-badge-success'
                      : selectedOrder.status === 'SHIPPING'
                        ? 'nx-badge-primary'
                        : selectedOrder.status === 'CANCELLED'
                          ? 'nx-badge-danger'
                          : 'nx-badge-warning'
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                <i className="bi bi-clock me-1"></i>
                Đặt lúc: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>

            {/* Thông tin 2 bên: Người mua & Người bán */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {/* Thẻ Người Mua */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: '#1e293b',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '6px',
                  }}
                >
                  <i className="bi bi-person-check-fill text-primary" style={{ fontSize: '16px' }}></i>
                  <span>Thông tin Người mua / Nhận hàng</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'inline-block', width: '90px' }}>Họ tên:</span>
                    <strong>{selectedOrder.receiverName || selectedOrder.buyerName || 'Chưa cập nhật tên'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'inline-block', width: '90px' }}>Điện thoại:</span>
                    <strong style={{ color: '#16a34a' }}>
                      <i className="bi bi-telephone-fill me-1"></i>
                      {selectedOrder.receiverPhone || 'Chưa cung cấp'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'inline-block', width: '90px' }}>Mã Buyer ID:</span>
                    <code style={{ fontSize: '11px', color: '#475569' }}>
                      {selectedOrder.buyerId || 'N/A'}
                    </code>
                  </div>
                </div>
              </div>

              {/* Thẻ Người Bán & Giao dịch */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: '#1e293b',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '6px',
                  }}
                >
                  <i className="bi bi-shop text-warning" style={{ fontSize: '16px' }}></i>
                  <span>Thông tin Người bán & Giao dịch</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'inline-block', width: '90px' }}>Mã Seller ID:</span>
                    <code style={{ fontSize: '11px', color: '#d97706' }}>
                      {selectedOrder.sellerId || 'N/A'}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'inline-block', width: '90px' }}>Hình thức:</span>
                    <span>{selectedOrder.orderType || 'Đơn hàng thông thường (REGULAR)'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'inline-block', width: '90px' }}>Cập nhật:</span>
                    <span style={{ color: '#64748b' }}>
                      {selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString('vi-VN') : 'Theo đơn'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thẻ Địa chỉ nhận hàng */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="bi bi-geo-alt-fill text-danger"></i>
                <span>Địa chỉ giao nhận hàng:</span>
              </div>
              <div style={{ color: '#334155', paddingLeft: '22px', fontSize: '13px', lineHeight: 1.5 }}>
                {selectedOrder.shippingAddress || 'Chưa có thông tin địa chỉ giao nhận'}
              </div>
            </div>

            {/* Chi tiết mặt hàng (items) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                  <i className="bi bi-box-seam me-1 text-primary"></i>
                  Danh sách sản phẩm trong đơn ({selectedOrder.items?.length ?? selectedOrder.itemCount ?? selectedOrder.itemsCount ?? 1} món):
                </strong>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table className="nx-admin-table" style={{ margin: 0, fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Sản phẩm & SKU</th>
                      <th style={{ textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ textAlign: 'center' }}>Số lượng</th>
                      <th style={{ textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it, idx) => (
                        <tr key={it.id || it.skuCodeSnapshot || idx}>
                          <td>
                            <strong style={{ color: '#1e293b' }}>{it.productNameSnapshot || 'Sản phẩm'}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Mã SKU: <code>{it.skuCodeSnapshot || 'N/A'}</code>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(it.unitPrice)}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>x{it.quantity}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                            {formatCurrency(it.subtotal || it.unitPrice * it.quantity)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                          Chi tiết sản phẩm đã được lưu trong đơn hàng.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bảng phân tích tài chính / Chi tiết giá trị mặt hàng, giảm giá, phí ship */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                marginLeft: 'auto',
                width: '100%',
                maxWidth: '420px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Giá trị mặt hàng (Tiền hàng):</span>
                <span style={{ fontWeight: 600 }}>
                  {formatCurrency(
                    selectedOrder.subtotal !== undefined
                      ? selectedOrder.subtotal
                      : selectedOrder.totalAmount - (selectedOrder.shippingFee || 0) + (selectedOrder.discount || 0)
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#16a34a' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Giảm giá {selectedOrder.discountCode && <span className="nx-badge nx-badge-warning" style={{ fontSize: '10px' }}>{selectedOrder.discountCode}</span>}:
                </span>
                <span style={{ fontWeight: 600 }}>
                  - {formatCurrency(selectedOrder.discount || 0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Phí vận chuyển (Phí ship):</span>
                <span style={{ fontWeight: 600 }}>
                  + {formatCurrency(selectedOrder.shippingFee || 0)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid #cbd5e1',
                  marginTop: '6px',
                  alignItems: 'baseline',
                }}
              >
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Tổng thanh toán:</strong>
                <strong style={{ fontSize: '17px', color: '#315bf4' }}>
                  {formatCurrency(selectedOrder.totalAmount)}
                </strong>
              </div>
            </div>

            {/* Cập nhật trạng thái giao dịch */}
            <div>
              <strong style={{ display: 'block', marginBottom: '6px' }}>Cập nhật trạng thái giao dịch:</strong>
              {selectedOrder.status === 'COMPLETED' || selectedOrder.status === 'CANCELLED' ? (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    color: '#92400e',
                    fontSize: '12.5px',
                  }}
                >
                  <i className="bi bi-info-circle-fill me-1"></i>
                  Đơn hàng đã ở trạng thái kết thúc (<code>{selectedOrder.status}</code>).
                  Theo quy định nghiệp vụ Backend (FR-24/25), không thể chuyển sang trạng thái khác.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {(['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        className={`nx-btn nx-btn-sm ${
                          selectedOrder.status === st ? 'nx-btn-primary' : 'nx-btn-outline'
                        }`}
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                      >
                        {st}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>

      {/* Campaign Create/Edit Modal */}
      <AdminModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        title={selectedCampaign ? 'Chỉnh sửa chiến dịch khuyến mãi' : 'Tạo chiến dịch khuyến mãi mới'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveCampaign}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#1e40af',
              }}
            >
              <i className="bi bi-info-circle-fill me-1"></i>
              Chiến dịch (Campaign) là chương trình khuyến mãi theo mùa/sự kiện (FR-46, FR-58).
              Sau khi tạo chiến dịch, bạn có thể tạo các mã giảm giá (Vouchers) gắn vào chiến dịch này.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Tên chiến dịch *
              </label>
              <input
                type="text"
                required
                maxLength={200}
                className="form-control"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="VD: Siêu hội mua sắm 11/11, Lễ hội mùa thu 2026..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Mô tả chiến dịch
              </label>
              <textarea
                className="form-control"
                rows={3}
                maxLength={2000}
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                placeholder="Mô tả mục tiêu, đối tượng áp dụng của chiến dịch..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={campaignForm.endDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Trạng thái
              </label>
              <select
                className="form-control"
                value={campaignForm.status}
                onChange={(e) =>
                  setCampaignForm({ ...campaignForm, status: e.target.value as CampaignStatus })
                }
              >
                <option value="ACTIVE">ACTIVE (Kích hoạt ngay)</option>
                <option value="DRAFT">DRAFT (Lưu bản nháp)</option>
                {selectedCampaign && <option value="ENDED">ENDED (Đã kết thúc)</option>}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                className="nx-btn nx-btn-outline"
                onClick={() => setShowCampaignModal(false)}
              >
                Huỷ
              </button>
              <button type="submit" className="nx-btn nx-btn-primary">
                {selectedCampaign ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Coupon Create/Edit Modal */}
      <AdminModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        title={selectedCoupon ? 'Chỉnh sửa mã giảm giá (Voucher)' : 'Tạo mã giảm giá mới (Voucher)'}
        maxWidth="620px"
      >
        <form onSubmit={handleSaveCoupon}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Chiến dịch khuyến mãi trực thuộc
              </label>
              <select
                className="form-control"
                value={couponForm.campaignId}
                onChange={(e) => setCouponForm({ ...couponForm, campaignId: e.target.value })}
              >
                <option value="">-- Áp dụng độc lập toàn sàn (Không thuộc chiến dịch) --</option>
                {campaigns.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.name} ({camp.status})
                  </option>
                ))}
              </select>
              <small style={{ color: '#64748b', fontSize: '11.5px' }}>
                Mã giảm giá có thể gắn vào 1 chiến dịch cụ thể hoặc phát hành độc lập toàn sàn.
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Mã Voucher (Code) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  className="form-control"
                  style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      code: e.target.value.toUpperCase().replace(/\s+/g, ''),
                    })
                  }
                  placeholder="VD: SALE10, FREESHIP..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Loại giảm giá *
                </label>
                <select
                  className="form-control"
                  value={couponForm.discountType}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT',
                    })
                  }
                >
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="FIXED_AMOUNT">Số tiền cố định (VND)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  {couponForm.discountType === 'PERCENTAGE'
                    ? 'Mức giảm (%) (1-100) *'
                    : 'Số tiền giảm (VND) *'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={couponForm.discountType === 'PERCENTAGE' ? 100 : undefined}
                  step={couponForm.discountType === 'PERCENTAGE' ? 1 : 1000}
                  className="form-control"
                  value={couponForm.discountValue}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Đơn hàng tối thiểu (VND) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={10000}
                  className="form-control"
                  value={couponForm.minOrderAmount}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Giới hạn lượt sử dụng
                </label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  placeholder="Để trống = Không giới hạn"
                  value={couponForm.usageLimit}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      usageLimit: e.target.value ? Number(e.target.value) : '',
                    })
                  }
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Trạng thái
                </label>
                <select
                  className="form-control"
                  value={couponForm.status}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      status: e.target.value as 'ACTIVE' | 'INACTIVE',
                    })
                  }
                >
                  <option value="ACTIVE">ACTIVE (Kích hoạt)</option>
                  <option value="INACTIVE">INACTIVE (Vô hiệu)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={couponForm.startAt}
                  onChange={(e) => setCouponForm({ ...couponForm, startAt: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Ngày hết hạn
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={couponForm.endAt}
                  onChange={(e) => setCouponForm({ ...couponForm, endAt: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                className="nx-btn nx-btn-outline"
                onClick={() => setShowCouponModal(false)}
              >
                Huỷ
              </button>
              <button type="submit" className="nx-btn nx-btn-primary">
                {selectedCoupon ? 'Lưu thay đổi' : 'Lưu mã giảm giá'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}

export default AdminCommercePage;
