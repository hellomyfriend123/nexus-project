import { useMemo } from 'react';
import { serializeRichTextHtml } from '../../utils/richTextHtml';
import '../../styles/rich-text.css';

interface Props {
  value?: string | null;
  fallback: string;
  className?: string;
}

export default function RichTextContent({ value, fallback, className = '' }: Props) {
  const safeHtml = useMemo(() => {
    // Vite renders in the browser. During SSR, React safely escapes the source text;
    // never pass unsanitized API data to dangerouslySetInnerHTML without a DOM parser.
    if (!value || typeof DOMParser === 'undefined' || typeof document === 'undefined') return null;
    return serializeRichTextHtml(value);
  }, [value]);
  const classes = `nx-rich-text nx-rich-text-display ${className}`.trim();

  if (safeHtml) return <div className={classes} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
  return <div className={classes}>{safeHtml === null ? value?.trim() || fallback : fallback}</div>;
}
