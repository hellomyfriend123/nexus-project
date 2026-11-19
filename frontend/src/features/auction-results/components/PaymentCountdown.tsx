import { formatMoney } from '../services/auctionResultService';
interface Props { seconds: number; amount: number; methods: string[]; onAction: (label: string) => void }
export default function PaymentCountdown({ amount }: Props) {
  return <section className="ar-payment"><div className="ar-payment-heading"><h2>Thanh toán đơn hàng</h2><b>Thanh toán đơn hàng chưa được hỗ trợ.</b></div><div className="ar-countdown" aria-label="Chưa có hạn thanh toán">{['GIỜ', 'PHÚT', 'GIÂY'].map(label => <div key={label}><strong>N/A</strong><small>{label}</small></div>)}</div><p>API kết quả không cung cấp hạn thanh toán. Không áp dụng thời hạn hoặc tự động chuyển quyền mua giả định.</p><button className="ar-button ar-primary ar-pay-button" disabled><i className="bi bi-bag-check" /><span>Thanh toán đơn hàng chưa được hỗ trợ.<small>({formatMoney(amount)})</small></span></button></section>;
}
