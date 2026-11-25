// Lucian UX/UI Prompt #070 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#070
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, PropsWithChildren } from 'react';
import { notify, toastStore } from './toast';
import type { ToastRecord } from './toast';
import './toast.css';

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
function ToastCard({ toast, index, expanded, offset, paused, onHeight, onDrag }: {
  toast: ToastRecord; index: number; expanded: boolean; offset: number; paused: boolean;
  onHeight: (id: ToastRecord['id'], height: number) => void; onDrag: (dragging: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [drag, setDrag] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(0);
  const [progress, setProgress] = useState(1);
  const start = useRef<number | null>(null);
  const remaining = useRef(toast.autoClose || 4500);
  const front = index === 0;
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  useClientLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => onHeight(toast.id, element.offsetHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); onHeight(toast.id, 0); };
  }, [toast.id, onHeight]);
  useEffect(() => { remaining.current = toast.autoClose || 4500; }, [toast.autoClose, toast.message, toast.type]);
  useEffect(() => {
    if (!front || paused || drag !== 0 || toast.leaving || toast.autoClose === false || toast.type === 'loading') return;
    const began = Date.now();
    const duration = toast.autoClose || 4500;
    const initial = remaining.current;
    let frame = 0;
    const tick = () => { setProgress(Math.max(0, (initial - (Date.now() - began)) / duration)); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    const timer = setTimeout(() => notify.dismiss(toast.id), remaining.current);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); remaining.current = Math.max(0, remaining.current - (Date.now() - began)); };
  }, [front, paused, drag, toast.leaving, toast.autoClose, toast.id, toast.message, toast.type]);
  useEffect(() => {
    if (!toast.leaving) return;
    const timer = setTimeout(() => toastStore.remove(toast.id), 450);
    return () => clearTimeout(timer);
  }, [toast.id, toast.leaving]);
  const y = expanded ? -offset : -index * 14;
  const scale = expanded ? 1 : 1 - index * .06;
  const transform = toast.leaving && swipeDirection ? `translate(${swipeDirection * 420}px, ${y}px) rotate(${swipeDirection * 8}deg)` : !entered ? 'translateY(90px) scale(.9)' : `translate(${drag}px, ${y}px) scale(${scale})`;
  return <div ref={ref} className={`u070-toast u070-${toast.type}${toast.leaving ? ' leave' : ''}${!expanded && !front ? ' back' : ''}`}
    inert={!expanded && !front} aria-hidden={!expanded && !front ? true : undefined}
    style={{ transform, opacity: !entered || toast.leaving || (!expanded && index > 2) ? 0 : Math.max(.2, 1 - Math.abs(drag) / 260), zIndex: 100 - index,
      pointerEvents: !expanded && !front ? 'none' : undefined, transition: isDragging ? 'none' : undefined } as CSSProperties}
    onPointerDown={event => {
      if (event.button !== 0 || (event.target as HTMLElement).closest('button, a, input')) return;
      start.current = event.clientX; setIsDragging(true); onDrag(true); event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => { if (start.current !== null) setDrag(event.clientX - start.current); }}
    onPointerUp={event => {
      if (start.current === null) return;
      const distance = event.clientX - start.current;
      start.current = null; setIsDragging(false); setDrag(0); onDrag(false);
      if (Math.abs(distance) > 90) { setSwipeDirection(distance > 0 ? 1 : -1); notify.dismiss(toast.id); }
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }}
    onPointerCancel={() => { start.current = null; setIsDragging(false); setDrag(0); onDrag(false); }}
    onLostPointerCapture={() => { start.current = null; setIsDragging(false); setDrag(0); onDrag(false); }}>
    <span className="u070-icon" aria-hidden="true">{toast.type === 'loading' ? <span className="u070-spinner" /> : <svg viewBox="0 0 18 18">
      {toast.type === 'success' ? <path d="M4 9.4l3.2 3.2L14 5.6" /> : toast.type === 'info' ? <path d="M3.5 4.5h11v7h-6l-3 2.5v-2.5h-2z" /> : <path d="M9 5v5M9 13h.01" />}
    </svg>}</span>
    <div className="u070-body" role={toast.role ?? (toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status')} aria-atomic="true">
      {toast.title && <div className="u070-title">{toast.title}</div>}<div className="u070-message">{toast.message}</div>
    </div>
    {toast.action && <button type="button" className="u070-action" onClick={() => { toast.action?.onClick(); notify.dismiss(toast.id); }}>{toast.action.label}</button>}
    <button className="u070-close" type="button" aria-label="Đóng thông báo" onClick={() => notify.dismiss(toast.id)}><svg viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" /></svg></button>
    {toast.autoClose !== false && toast.type !== 'loading' && <span className="u070-bar" aria-hidden="true" style={{ '--left': progress } as CSSProperties} />}
  </div>;
}
function ToastStack({ toasts }: { toasts: readonly ToastRecord[] }) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const measure = useCallback((id: ToastRecord['id'], height: number) => setHeights(previous => {
    if (!height) { const next = { ...previous }; delete next[String(id)]; return next; }
    return previous[String(id)] === height ? previous : { ...previous, [String(id)]: height };
  }), []);
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    visibility(); document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  const active = toasts.filter(toast => !toast.leaving);
  const expanded = hover || focus;
  const stackHeight = expanded ? active.reduce((sum, toast) => sum + (heights[String(toast.id)] ?? 80) + 8, -8) : (heights[String(active[0]?.id)] ?? 80) + Math.min(active.length - 1, 2) * 14;
  return <section className="ux u070" aria-label="Thông báo ứng dụng" tabIndex={0}
    style={{ height: Math.max(0, stackHeight) }}
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onFocus={() => setFocus(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false); }}>
    {toasts.map((toast, index) => {
      const preceding = toasts.slice(0, index).filter(entry => !entry.leaving);
      const currentIndex = toast.leaving ? index : preceding.length;
      const currentOffset = preceding.reduce((sum, entry) => sum + (heights[String(entry.id)] ?? 80) + 8, 0);
      return <ToastCard key={toast.id} toast={toast} index={currentIndex} expanded={expanded} offset={currentOffset}
        paused={hover || focus || dragging || hidden} onHeight={measure} onDrag={setDragging} />;
    })}
  </section>;
}

/** One container for the whole application; do not mount it in individual pages. */
export default function ToastProvider({ children }: PropsWithChildren) {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getServerSnapshot);
  return <>{children}{toasts.length > 0 && <ToastStack toasts={toasts} />}</>;
}
