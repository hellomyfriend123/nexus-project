// Lucian UX/UI Prompt #205 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#205
import { useEffect, useRef } from 'react';
import './NexusLogo.css';

function NexusLogo({ playLoginIntro = false }: { playLoginIntro?: boolean }) {
  const rootRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const root = rootRef.current!;
    const letters = Array.from(
      root.querySelectorAll<HTMLElement>('.u205-l'),
    ).map((el) => ({ el, x: 0, y: 0, v: 0 }));
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = media.matches;
    const amp = 34,
      sigma = 34;
    let px: number | null = null,
      pulse: number | null = null,
      raf = 0;
    function measure() {
      letters.forEach((l) => {
        l.x = l.el.offsetLeft + l.el.offsetWidth / 2;
      });
    }
    function gaussian(d: number, s: number) {
      return Math.exp(-(d * d) / (2 * s * s));
    }
    function tick(now: number) {
      raf = 0;
      let moving = false,
        pc: number | null = null;
      if (pulse !== null) {
        const k = (now - pulse) / 1100;
        if (k >= 1) pulse = null;
        else pc = -60 + (root.offsetWidth + 120) * k;
      }
      letters.forEach((l) => {
        let target = 0;
        if (px !== null) target -= amp * gaussian(l.x - px, sigma);
        if (pc !== null) target -= amp * 1.35 * gaussian(l.x - pc, sigma * 1.2);
        l.v += (target - l.y) * 0.16;
        l.v *= 0.8;
        l.y += l.v;
        if (Math.abs(l.v) > 0.02 || Math.abs(target - l.y) > 0.05)
          moving = true;
        const t = Math.min(1, Math.max(0, -l.y / 50));
        l.el.style.setProperty('--y', l.y.toFixed(2) + 'px');
        l.el.style.setProperty(
          '--sy',
          (1 + Math.max(-0.08, Math.min(0.14, -l.v * 0.02))).toFixed(3),
        );
        l.el.style.setProperty('--t', t.toFixed(3));
      });
      if (moving || pulse !== null || px !== null)
        raf = requestAnimationFrame(tick);
    }
    function kick() {
      if (!raf && !reduced) raf = requestAnimationFrame(tick);
    }
    function move(event: PointerEvent) {
      if (reduced) return;
      measure();
      const rect = root.getBoundingClientRect();
      px = (event.clientX - rect.left) * (root.offsetWidth / (rect.width || 1));
      kick();
    }
    function leave() {
      px = null;
      kick();
    }
    function wave() {
      if (reduced) return;
      measure();
      pulse = performance.now();
      kick();
    }
    function resetMotion() {
      reduced = media.matches;
      if (!reduced) return;
      cancelAnimationFrame(raf);
      raf = 0;
      px = null;
      pulse = null;
      letters.forEach((l) => {
        l.y = 0;
        l.v = 0;
        l.el.style.removeProperty('--y');
        l.el.style.removeProperty('--sy');
        l.el.style.removeProperty('--t');
      });
    }
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', leave);
    root.addEventListener('pointercancel', leave);
    root.addEventListener('click', wave);
    root.addEventListener('blur', leave);
    media.addEventListener('change', resetMotion);
    measure();
    // Defer playback so StrictMode can cancel its first setup before starting a wave.
    const introFrame = playLoginIntro && !reduced
      ? requestAnimationFrame(() => {
          if (reduced) return;
          wave();
        })
      : 0;
    return () => {
      cancelAnimationFrame(introFrame);
      cancelAnimationFrame(raf);
      observer.disconnect();
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      root.removeEventListener('pointercancel', leave);
      root.removeEventListener('click', wave);
      root.removeEventListener('blur', leave);
      media.removeEventListener('change', resetMotion);
    };
  }, [playLoginIntro]);
  return (
    <button
      ref={rootRef}
      type="button"
      className="u205 nexus-logo"
      aria-label="NEXUS — tạo sóng chữ"
      title="NEXUS"
    >
      {Array.from('NEXUS').map((letter, index) => (
        <span key={index} className="u205-l" aria-hidden="true">
          {letter}
        </span>
      ))}
    </button>
  );
}

export default NexusLogo;
