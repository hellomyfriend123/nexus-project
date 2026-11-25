import type { ProductAssuranceItem } from '../types/productAssurance';

// Static UI configuration, not a verified commercial policy or a mock API.
// Replace via ProductAssurance's items prop after a separately approved integration.
const simulationNotice =
  'Thông tin mô phỏng phục vụ kiểm tra giao diện, không phải cam kết thương mại đã được xác nhận.';

export const productAssuranceConfig: readonly ProductAssuranceItem[] = [
  {
    id: 'nexus-guarantee',
    title: 'Nexus Guarantee',
    description:
      'Mô phỏng thông tin bảo vệ giao dịch và thanh toán. Điều kiện bảo vệ và giải ngân chưa được hệ thống xác nhận.',
    icon: 'shield',
    enabled: true,
    simulationNotice,
  },
  {
    id: 'shipping-information',
    title: 'THÔNG TIN VẬN CHUYỂN',
    description:
      'Mô phỏng thông tin vận chuyển. Phí, thời gian giao hàng và phạm vi bảo hiểm chưa được hệ thống xác nhận.',
    icon: 'bag',
    enabled: true,
    simulationNotice,
  },
  {
    id: 'return-warranty',
    title: 'ĐỔI TRẢ & BẢO HÀNH',
    description:
      'Mô phỏng thông tin đổi trả và bảo hành. Thời hạn, chi phí và điều kiện áp dụng chưa được hệ thống xác nhận.',
    icon: 'check',
    enabled: true,
    simulationNotice,
  },
];
