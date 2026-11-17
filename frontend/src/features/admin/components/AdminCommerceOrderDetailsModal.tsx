import AdminModal from '../components/AdminModal';
import type { OrderStatus } from '../types/admin.types';
import type { useAdminCommerce } from '../hooks/useAdminCommerce';

export function AdminCommerceOrderDetailsModal(model: ReturnType<typeof useAdminCommerce>) {
  const { selectedOrder, setSelectedOrder, handleUpdateOrderStatus, formatCurrency } = model;
  return (
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
                  selectedOrder.status === 'COMPLETED'
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
  );
}
