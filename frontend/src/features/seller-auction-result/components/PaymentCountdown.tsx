interface Props {
  countdown: string;
  paymentWindow: string;
}

export default function PaymentCountdown({ countdown, paymentWindow }: Props) {
  return (
    <section className="nx-ar-countdown" aria-label="Thời hạn thanh toán">
      <span>
        <i className="bi bi-hourglass-split" aria-hidden="true" /> Trạng thái thanh toán chưa được API kết quả cung cấp</span>
      <strong>{countdown}</strong>
      <span>Thời hạn thanh toán: {paymentWindow}</span>
    </section>
  );
}
