// Legacy UI fixture only. Not used by the live result screen. TODO: remove after visual fixture migration.
import type { Settlement } from '../types/auctionResult';
// TODO: Replace simulated settlement/policy data with an approved REST API contract.
// These values are UI fixtures, not a verified refund, wallet balance, or commercial guarantee.
export const settlementMock: Settlement = {
  refundReference: 'RFN-2025-108', refundedAt: '01:04:16 / 26-10', wallet: 'Ví Nexus',
  paymentMethods: ['Bảo hiểm Escrow', 'Mã hóa ngân hàng'],
  escrowBenefits: ['Đảm bảo máy ảnh đúng mô tả sản phẩm.', 'Trực tiếp kiểm tra cảm biến không bụi xước và số shot chuẩn 2.400.', 'Xác nhận tình trạng hoạt động trước khi giải ngân tiền.'],
  steps: [
    { title: 'Bước 1: Chốt kết quả & Xác nhận phiên', description: 'Đã hoàn thành lúc 00:00 ngày 26/10/2025', state: 'done' },
    { title: 'Bước 2: Thanh toán & Chọn địa chỉ', description: 'Dành cho Alex Nguyen trong 24 giờ. Đang xử lý ở bước này.', state: 'active' },
    { title: 'Bước 3: Người bán gửi đơn Trung tâm Nexus', description: 'CameraHub VN chuẩn bị và gửi hàng đến trung tâm kiểm định.', state: 'pending' },
    { title: 'Bước 4: Kiểm định & Giao hàng', description: 'Chuyên viên Nexus kiểm định sản phẩm và giao đến bạn.', state: 'pending' },
  ],
};
