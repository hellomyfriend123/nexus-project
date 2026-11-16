// Lucian UX/UI Prompt #363 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#363
import { useEffect, useRef } from 'react';
import './DotGridBackground.css';
import { dotWaveHeight } from './dotGridWaves';
import type { DotWave } from './dotGridWaves';

/** Decorative, shared viewport adaptation; never participates in focus or hit testing. */
export default function DotGridBackground() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    const canvas = root?.querySelector('canvas');
    const cx = canvas?.getContext('2d');
    if (!root || !canvas || !cx) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    let reduced = motion.matches;
    let visible = true;
    let raf = 0;
    let width = 0;
    let height = 0;
    let idle = '#8E8A97';
    let waves: DotWave[] = [];
    let dots: Array<[number, number]> = [];
    let lastAdd = -Infinity;
    let snapshotTime: number | null = null;
    const active = () => visible && !document.hidden && root.isConnected;
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const draw = (now: number) => {
      cx.clearRect(0, 0, width, height);
      for (const [x, y] of dots) {
        const m = dotWaveHeight(x, y, now, waves);
        const r = 1.6 + Math.max(0, m) * 3.4;
        const hue = 230 - Math.max(0, m) * 110;
        const calm = Math.abs(m) < 0.04;
        cx.globalAlpha = calm ? 0.55 : 1;
        cx.fillStyle = calm ? idle : `hsl(${hue.toFixed(0)} 85% ${(58 - Math.min(0, m) * 10).toFixed(0)}%)`;
        cx.beginPath();
        cx.arc(x, y - m * 3, r, 0, 6.2832);
        cx.fill();
      }
      cx.globalAlpha = 1;
    };
    const frame = (now: number) => {
      raf = 0;
      if (!active() || reduced) return;
      waves = waves.filter(w => now - w.t < 2600);
      draw(now);
      // Retain the final canvas bitmap; an idle grid needs no animation loop.
      if (waves.length) raf = requestAnimationFrame(frame);
    };
    const run = () => {
      if (!active()) { stop(); return; }
      const now = performance.now();
      if (reduced) { stop(); draw(snapshotTime ?? now); return; }
      waves = waves.filter(w => now - w.t < 2600);
      draw(now);
      if (waves.length && !raf) raf = requestAnimationFrame(frame);
    };
    const theme = () => {
      idle = getComputedStyle(root).getPropertyValue('--ux-ink-3').trim() || '#8E8A97';
      run();
    };
    const resize = () => {
      const bounds = root.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = 17; y < height - 4; y += 17) {
        for (let x = 17; x < width - 4; x += 17) dots.push([x, y]);
      }
      theme();
    };
    const add = (event: PointerEvent, amplitude: number, snapshotAge: number) => {
      if (!active()) return;
      const now = performance.now();
      waves = waves.filter(w => now - w.t < 2600);
      const bounds = root.getBoundingClientRect();
      waves.push({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, t: now, a: amplitude });
      if (waves.length > 14) waves.shift();
      snapshotTime = reduced ? now + snapshotAge : null;
      run();
    };
    const move = (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastAdd < 110) return;
      lastAdd = now;
      add(event, 0.55, 300);
    };
    const press = (event: PointerEvent) => add(event, 1.6, 500);
    const preference = () => {
      reduced = motion.matches;
      // Freeze a useful wave state, rather than requiring an animation to complete.
      snapshotTime = reduced ? performance.now() + 300 : null;
      run();
    };
    const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true;
      run();
    });
    const sizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    const themeObserver = new MutationObserver(theme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    intersection?.observe(root);
    sizeObserver?.observe(root);
    motion.addEventListener('change', preference);
    scheme.addEventListener('change', theme);
    document.addEventListener('visibilitychange', run);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', press, { passive: true });
    resize();
    return () => {
      stop();
      intersection?.disconnect();
      sizeObserver?.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener('change', preference);
      scheme.removeEventListener('change', theme);
      document.removeEventListener('visibilitychange', run);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', press);
    };
  }, []);
  return <div ref={ref} className="ux u363" aria-hidden="true"><canvas className="u363-cv" /></div>;
}
