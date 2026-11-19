import { useEffect, useState } from 'react';
import './thumbnail.css';

export interface ThumbnailProps {
  /** Image URL, or null when the record has no image available. */
  src: string | null | undefined;
  alt: string;
  className?: string;
}

/**
 * Fixed-size product thumbnail shared by order and auction lists.
 *
 * The box keeps its dimensions in every state (missing image, load error, loading) so rows
 * never reflow. A failed load is not retried on re-render: the component keeps a local
 * failure flag instead of letting the browser hammer a dead URL.
 */
export default function Thumbnail({ src, alt, className = '' }: ThumbnailProps) {
  const [failed, setFailed] = useState(false);

  // A new src deserves a fresh attempt.
  useEffect(() => { setFailed(false); }, [src]);

  const usable = Boolean(src) && !failed;

  return (
    <span className={`nx-thumb ${className}`.trim()}>
      {usable ? (
        <img
          className="nx-thumb__image"
          src={src as string}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="nx-thumb__placeholder" role="img" aria-label={src ? `${alt}: ảnh không tải được` : `${alt}: chưa có ảnh`}>
          <i className="bi bi-image" aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
