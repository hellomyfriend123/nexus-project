import type { CreateAuctionState } from '../hooks/useCreateAuction';
import AuctionSection from './AuctionSection';

export default function AuctionScheduleSection({ hub }: { hub: CreateAuctionState }) {
  const { draft, update } = hub;
  return <AuctionSection number={3} title="Thiết Lập Lịch Trình & Chống Bắn Tỉa (Anti-Sniping)" caption="Lựa chọn thời điểm bắt đầu và thời lượng phù hợp cho sản phẩm của bạn.">
    <fieldset disabled={hub.busy || !!hub.created} className="sca-fieldset">
      <div className="sca-schedule-grid">
        <div><div className="sca-field-label">Hình thức khởi chạy</div><div className="sca-two-columns sca-start-choices">
          <button type="button" aria-pressed={draft.startNow} className={draft.startNow ? 'is-selected' : ''} onClick={() => update('startNow', true)}><i className="bi bi-lightning-charge" aria-hidden="true" /><div><strong>Kích hoạt ngay lập tức</strong><span>Tại thời điểm gửi phiên</span></div></button>
          <button type="button" aria-pressed={!draft.startNow} className={!draft.startNow ? 'is-selected' : ''} onClick={() => update('startNow', false)}><i className="bi bi-calendar3" aria-hidden="true" /><div><strong>Lên lịch mở phiên (Scheduled)</strong><span>Chọn ngày và giờ</span></div></button>
        </div>
        {!draft.startNow && <div className="sca-two-columns"><label className="sca-field"><span>Ngày bắt đầu *</span><input type="date" value={draft.startDate} onChange={event => update('startDate', event.target.value)} /></label><label className="sca-field"><span>Giờ bắt đầu *</span><input type="time" value={draft.startTime} onChange={event => update('startTime', event.target.value)} /></label></div>}</div>
        <div><div className="sca-field-label">Thời lượng phiên đấu giá *</div><div className="sca-duration">{[1, 3, 5, 7, 10].map(days => <button type="button" key={days} aria-pressed={draft.duration === String(days)} className={draft.duration === String(days) ? 'is-selected' : ''} onClick={() => update('duration', String(days))}>{days} ngày</button>)}</div></div>
      </div>
    </fieldset>
    <div className="sca-end-time"><i className="bi bi-clock" aria-hidden="true" /><span>Kết thúc dự kiến: <strong>{hub.endDate}</strong></span></div>
    <div className="sca-soft-close"><div className="sca-toggle-row"><div><strong>Tự động gia hạn (Anti-sniping)</strong><p>Chưa khả dụng: API tạo phiên chưa hỗ trợ tự động gia hạn khi có lượt đấu giá cuối phiên.</p></div><button type="button" className="sca-toggle" role="switch" aria-checked={false} aria-label="Tự động gia hạn: chưa hỗ trợ" disabled><span /></button></div></div>
    <p className="sca-muted">Thời gian theo múi giờ thiết bị, gửi theo UTC. Trạng thái phiên do máy chủ quyết định.</p>
  </AuctionSection>;
}

