import { useId } from 'react';
// Local illustrated placeholders; not official product photography.
function ProductImage({
  kind,
  label,
  className = '',
}: {
  kind: string;
  label: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  // Asset URLs share the SVG wrapper so existing image-flight animations still work.
  if (
    kind.startsWith('/') ||
    kind.startsWith('http:') ||
    kind.startsWith('https:') ||
    kind.startsWith('data:') ||
    ['.webp', '.png', '.jpg', '.jpeg', '.avif', '.svg'].some((extension) =>
      kind.toLowerCase().split('?')[0].endsWith(extension),
    )
  ) {
    return (
      <svg
        className={`nx-product-image ${className}`}
        viewBox="0 0 400 320"
        role="img"
        aria-label={label}
      >
        <image
          href={kind}
          width="400"
          height="320"
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    );
  }
  const symbols: Record<string, string> = {
    laptop: '💻',
    watch: '⌚',
    card: '🃏',
    camera: '📷',
    keyboard: '⌨️',
    headphones: '🎧',
    phone: '📱',
    storage: '💾',
    gpu: '🖥️',
  };
  return (
    <svg
      className={`nx-product-image ${className}`}
      viewBox="0 0 400 290"
      role="img"
      aria-label={`${label} — hình minh họa tạm`}
    >
      <defs>
        <linearGradient id={id} x2="1" y2="1">
          <stop stopColor="#e1e3e6" />
          <stop offset="1" stopColor="#faf9f7" />
        </linearGradient>
        <radialGradient id={`${id}glass`}>
          <stop stopColor="#7996ad" />
          <stop offset=".5" stopColor="#1a3046" />
          <stop offset="1" stopColor="#0a1018" />
        </radialGradient>
      </defs>
      <rect width="400" height="290" fill={`url(#${id})`} />
      <ellipse cx="200" cy="243" rx="115" ry="12" fill="#000" opacity=".08" />
      {kind === 'lens' ? (
        <g>
          <ellipse cx="191" cy="155" rx="83" ry="91" fill="#252830" />
          <ellipse cx="207" cy="151" rx="71" ry="84" fill="#575d66" />
          <ellipse
            cx="209"
            cy="151"
            rx="60"
            ry="73"
            fill={`url(#${id}glass)`}
          />
          <ellipse
            cx="195"
            cy="134"
            rx="18"
            ry="35"
            fill="#9fcddd"
            opacity=".3"
          />
          <text x="158" y="233" fontSize="11" fill="#c8b883">
            NIKKOR 50mm
          </text>
        </g>
      ) : (
        <text x="200" y="193" textAnchor="middle" fontSize="135">
          {symbols[kind] || '📦'}
        </text>
      )}
      <text x="12" y="277" fontSize="10" fill="#7b8088">
        ẢNH MINH HỌA TẠM
      </text>
    </svg>
  );
}

export default ProductImage;
