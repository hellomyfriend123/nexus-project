import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createOrderPayment, confirmPayment } from '../services/paymentService';

function formatPrice(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
}

interface Props {
  orderId: string;
  orderNumber: string;
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}

type Step = 'CARD' | 'OTP' | 'SUCCESS';

export default function VNPaySandboxModal({
  orderId,
  orderNumber,
  amount,
  onSuccess,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>('CARD');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState('9704198526191432198');
  const [cardHolder, setCardHolder] = useState('NGUYEN VAN A');
  const [issueDate, setIssueDate] = useState('07/15');
  const [otp, setOtp] = useState('123456');

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [vnpTxnRef, setVnpTxnRef] = useState<string>('');

  const handleFillTestData = () => {
    setCardNumber('9704198526191432198');
    setCardHolder('NGUYEN VAN A');
    setIssueDate('07/15');
  };

  const handleProceedToOtp = async () => {
    setErrorMessage(null);
    if (!cardNumber.trim() || !cardHolder.trim() || !issueDate.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin thẻ NCB Sandbox.');
      return;
    }

    setLoading(true);
    try {
      const payment = await createOrderPayment(orderId, amount, 'MOCK');
      setPaymentId(payment.id);
      setVnpTxnRef(payment.paymentReference || `VNP${Date.now()}`);
      setStep('OTP');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kết nối cổng VNPAY');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async () => {
    setErrorMessage(null);
    if (otp.trim() !== '123456') {
      setErrorMessage('Mã OTP không chính xác. Mã thử nghiệm VNPAY Sandbox là: 123456');
      return;
    }
    if (!paymentId) {
      setErrorMessage('Thiếu mã phiên giao dịch.');
      return;
    }

    setLoading(true);
    try {
      await confirmPayment(paymentId, 'SUCCESS');
      setStep('SUCCESS');
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1070 }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 540 }}>
        <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
          {/* HEADER VNPAY SANDBOX BRAND */}
          <div
            className="p-3 text-white d-flex align-items-center justify-content-between"
            style={{
              background: 'linear-gradient(135deg, #005baa 0%, #0077d8 100%)',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <span
                className="bg-white text-danger px-2 py-1 rounded small fw-bold"
                style={{ letterSpacing: 1 }}
              >
                VN<span style={{ color: '#005baa' }}>PAY</span>
              </span>
              <div>
                <div className="fw-bold fs-6">CỔNG THANH TOÁN VNPAY</div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>MÔI TRƯỜNG THỬ NGHIỆM (SANDBOX)</div>
              </div>
            </div>
            {step !== 'SUCCESS' && (
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Close"
                disabled={loading}
                onClick={onClose}
              />
            )}
          </div>

          <div className="modal-body p-4 bg-light">
            {/* THÔNG TIN ĐƠN HÀNG */}
            <div className="bg-white p-3 rounded-3 border mb-3 shadow-sm">
              <div className="d-flex justify-content-between mb-1 small">
                <span className="text-muted">Mã đơn hàng:</span>
                <strong className="text-dark">{orderNumber}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1 small">
                <span className="text-muted">Đơn vị chấp nhận thanh toán:</span>
                <span className="text-dark fw-semibold">NEXUS E-COMMERCE VN</span>
              </div>
              <div className="d-flex justify-content-between border-top pt-2 mt-2">
                <span className="text-muted small">Số tiền thanh toán:</span>
                <strong className="text-danger fs-5 fw-bold">{formatPrice(amount)}</strong>
              </div>
            </div>

            {errorMessage && (
              <div className="alert alert-danger py-2 px-3 small mb-3">
                {errorMessage}
              </div>
            )}

            {/* BƯỚC 1: NHẬP THÔNG TIN THẺ NỘI ĐỊA (NCB) */}
            {step === 'CARD' && (
              <div className="bg-white p-3 rounded-3 border shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary">Thẻ ATM / Internet Banking</span>
                    <span className="small text-muted fw-semibold">Ngân hàng NCB</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary py-0 px-2 fw-semibold"
                    style={{ fontSize: 11 }}
                    onClick={handleFillTestData}
                  >
                    ⚡ Điền thẻ test
                  </button>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Số thẻ ngân hàng (Test: 9704198526191432198)
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="9704198526191432198"
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-7">
                    <label className="form-label small fw-semibold text-secondary">
                      Tên in trên thẻ (không dấu)
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm text-uppercase"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="NGUYEN VAN A"
                    />
                  </div>
                  <div className="col-5">
                    <label className="form-label small fw-semibold text-secondary">
                      Ngày phát hành
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      placeholder="MM/YY (07/15)"
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3"
                    disabled={loading}
                    onClick={onClose}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm px-4 fw-bold shadow-sm"
                    disabled={loading}
                    onClick={handleProceedToOtp}
                    style={{ backgroundColor: '#005baa', borderColor: '#005baa' }}
                  >
                    {loading ? 'Đang kết nối...' : 'Xác thực thẻ & Tiếp tục →'}
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: XÁC THỰC MÃ OTP */}
            {step === 'OTP' && (
              <div className="bg-white p-3 rounded-3 border shadow-sm">
                <div className="alert alert-info py-2 px-3 small mb-3">
                  Mã OTP mô phỏng đã được gửi về số điện thoại đăng ký thẻ.
                  <br />
                  Mã OTP thử nghiệm là: <strong>123456</strong>
                </div>

                <div className="mb-3 text-center">
                  <label className="form-label small fw-bold text-dark d-block">
                    Nhập mã OTP xác thực giao dịch
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg text-center font-monospace fw-bold mx-auto"
                    style={{ maxWidth: 200, letterSpacing: 4, fontSize: 24 }}
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                  />
                  <div className="small text-muted mt-2">Mã giao dịch VNPAY: {vnpTxnRef}</div>
                </div>

                <div className="d-flex gap-2 justify-content-center mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3"
                    disabled={loading}
                    onClick={() => setStep('CARD')}
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    className="btn btn-success btn-sm px-4 fw-bold shadow-sm"
                    disabled={loading}
                    onClick={handleConfirmOtp}
                  >
                    {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: KẾT QUẢ THÀNH CÔNG */}
            {step === 'SUCCESS' && (
              <div className="bg-white p-4 rounded-3 border text-center shadow-sm">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center bg-success text-white mb-3"
                  style={{ width: 64, height: 64, fontSize: 32 }}
                >
                  ✓
                </div>
                <h4 className="fw-bold text-success mb-1">Thanh toán VNPAY thành công!</h4>
                <p className="text-secondary small mb-3">
                  Giao dịch trực tuyến đã được VNPAY Sandbox xác thực và quyết toán.
                </p>

                <div className="bg-light p-3 rounded text-start small mb-4 border">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Mã giao dịch:</span>
                    <strong className="text-dark font-monospace">{vnpTxnRef}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Số tiền đã trừ:</span>
                    <strong className="text-danger">{formatPrice(amount)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Ngân hàng:</span>
                    <span className="text-dark fw-semibold">NCB (Sandbox)</span>
                  </div>
                  <div className="d-flex justify-content-between border-top pt-1 mt-1">
                    <span className="text-muted">Trạng thái đơn hàng:</span>
                    <span className="badge bg-primary">Đã xác nhận (CONFIRMED)</span>
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3"
                    onClick={onClose}
                  >
                    Đóng
                  </button>
                  <Link
                    to="/buyer-hub"
                    className="btn btn-primary btn-sm px-4 fw-bold shadow-sm"
                    onClick={onClose}
                  >
                    Xem Đơn Hàng Của Tôi →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
