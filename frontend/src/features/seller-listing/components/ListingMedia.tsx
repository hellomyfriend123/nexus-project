import { useRef } from 'react';
import type { CreateListingState } from '../hooks/useCreateListing';

// Bước 2 — Bộ sưu tập ảnh/video kiểm định.
export default function ListingMedia({ hub }: { hub: CreateListingState }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p>Ảnh tải lên chỉ xem trước trong phiên này, không lưu vào bản nháp hay sản phẩm. Sản phẩm demo dùng ảnh mẫu.</p><input ref={inputRef} type="file" accept="image/*" multiple hidden aria-label="Chọn ảnh sản phẩm" onChange={event => { hub.addMedia(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><div className="nx-listing-media-grid">
        {hub.media.map(slot => (
          <figure key={slot.id} className="nx-listing-media">
            <img src={slot.image} alt={slot.label} />
            {slot.cover && <span className="nx-listing-media-cover">Ảnh bìa</span>}
            {slot.serialVerified && (
              <span className="nx-listing-media-serial">
                <i className="bi bi-check-lg" aria-hidden="true" />
                Seri OK
              </span>
            )}
            {!slot.cover && <figcaption className="nx-listing-media-label">{slot.label}</figcaption>}
            <div className="nx-listing-media-overlay">
              {slot.cover && (
                <button
                  type="button"
                  title="Xem ảnh lớn"
                  onClick={() => hub.mockAction('Xem ảnh lớn')}
                >
                  <i className="bi bi-zoom-in" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className="is-danger"
                title="Xóa ảnh"
                onClick={() => hub.removeMedia(slot.id)}
              >
                <i className="bi bi-trash" aria-hidden="true" />
              </button>
            </div>
          </figure>
        ))}

        <button type="button" className="nx-listing-media-add" onClick={() => inputRef.current?.click()}>
          <span className="nx-listing-media-add-icon">
            <i className="bi bi-images" aria-hidden="true" />
          </span>
          <strong>Thêm ảnh</strong>
          <span>Còn {9 - hub.media.length} vị trí</span>
        </button>

        <button type="button" className="nx-listing-media-video" onClick={() => hub.mockAction('Tải lên Video')}>
          <span className="nx-listing-media-video-icon">
            <i className="bi bi-camera-video" aria-hidden="true" />
          </span>
          <strong>Tải lên Video</strong>
          <span>15 - 60s (360°)</span>
        </button>
      </div>

      <div className="nx-listing-guide">
        <i className="bi bi-lightbulb" aria-hidden="true" />
        <p>
          <strong>Quy chuẩn kiểm định Nexus:</strong> Tin đăng có ảnh chụp số Serial trùng khớp
          với phiếu bảo hành sẽ tự động được gán nhãn{' '}
          <strong className="nx-listing-text-primary">"Đã xác thực Seri máy"</strong>, giúp tăng
          tốc độ chốt đơn lên gấp 2.4 lần và loại bỏ rủi ro khiếu nại hoàn tiền.
        </p>
      </div>
    </div>
  );
}
