import { useEffect, useState } from 'react';
import { formatCountdown } from '../utils/cart.format';

/**
 * Auction-win notice. The countdown is client-side only; the real deadline
 * must come from the auction service once the API layer exists.
 */
export default function AuctionWinBanner({
  seconds,
}: {
  seconds?: number;
}) {
  const [remaining, setRemaining] = useState(seconds ?? 0);

  useEffect(() => {
    if (seconds === undefined || seconds <= 0) return;
    const timer = window.setInterval(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [seconds]);

  return (
    <section className="nx-cart-banner" aria-label="Thông báo trúng đấu giá">
      <i
        className="bi bi-hammer nx-cart-banner-icon"
        aria-hidden="true"
      ></i>
      <div className="nx-cart-banner-body">
        <div className="nx-cart-banner-head">
          <h2 className="nx-cart-banner-title">
            Sản phẩm đấu giá cần hoàn tất thanh toán
          </h2>
          <span className="nx-cart-banner-pill">
            {seconds === undefined ? 'Chưa có thời hạn từ hệ thống' : `Thời hạn còn ${formatCountdown(remaining)}`}
          </span>
        </div>
        <p className="nx-cart-banner-text">
          Thời hạn thanh toán được xác nhận bởi hệ thống đấu giá.
        </p>
      </div>
    </section>
  );
}
