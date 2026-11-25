export default function ResultAvailability({ loading, error, onRetry }: { loading: boolean; error: string; onRetry: () => void }) {
  return <main className="ar-page nx-container"><section className="ar-panel ar-availability">{loading ? <p role="status">Đang tải kết quả đấu giá…</p> : <><p role="alert">{error || 'Chưa có kết quả đấu giá.'}</p><button className="ar-button ar-primary" onClick={onRetry}>Thử lại</button></>}</section></main>;
}
