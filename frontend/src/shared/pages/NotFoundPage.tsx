// Lucian UX/UI Prompt #089 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#089
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRecoverySuggestions } from './notFoundSuggestions';
import './not-found.css';

const ARROW = '<path d="M3 8h10M9 4l4 4-4 4"/>';
const CHECK = '<path d="M3.2 8.4l3 3L12.8 4.8"/>';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const suggestions = useMemo(() => getRecoverySuggestions(pathname), [pathname]);
  const ref = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState('');

  useEffect(() => { setHost(window.location.host); }, []);
  useEffect(() => {
    const root = ref.current!;
    const num = root.querySelector<HTMLElement>('.u089-num')!;
    const cols = root.querySelectorAll<HTMLElement>('.u089-col');
    const cp = root.querySelector<HTMLElement>('.u089-cp')!;
    const nd = root.querySelector<SVGElement>('.u089-nd')!;
    const path = root.querySelector<HTMLElement>('.u089-url b')!;
    const title = root.querySelector<HTMLElement>('.u089-t')!;
    const sub = root.querySelector<HTMLElement>('.u089-s')!;
    const rows = Array.from(root.querySelectorAll<HTMLButtonElement>('.u089-row'));
    const re = root.querySelector<HTMLButtonElement>('.u089-re')!;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rm = media.matches;
    let a = 0, v = 0, tgt = 0, raf = 0, last = 0;
    let busy = false, active = true, selected: number | null = null;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const cleanups: Array<() => void> = [];
    function listen(target: EventTarget, name: string, handler: EventListener) {
      target.addEventListener(name, handler);
      cleanups.push(() => target.removeEventListener(name, handler));
    }
    function later(fn: () => void, ms: number) {
      const timer = setTimeout(() => { timers.delete(timer); if (active) fn(); }, ms);
      timers.add(timer);
    }
    function clearWork() {
      timers.forEach(clearTimeout); timers.clear();
      cancelAnimationFrame(raf); raf = 0;
    }
    function step(now: number) {
      raf = 0;
      if (!active) return;
      const dt = Math.min(0.032, (now - last) / 1000); last = now;
      v += (220 * (tgt - a) - 17 * v) * dt; a += v * dt;
      nd.style.transform = `rotate(${a.toFixed(2)}deg)`;
      if (Math.abs(v) > 0.05 || Math.abs(tgt - a) > 0.05) raf = requestAnimationFrame(step);
    }
    function kick() {
      if (rm) { a = tgt; v = 0; nd.style.transform = `rotate(${a}deg)`; return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    }
    function aim(deg: number) { tgt = a + ((((deg - a) % 360) + 540) % 360) - 180; kick(); }
    function toward(x: number, y: number) {
      const r = cp.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
      aim(Math.atan2(dx, -dy) * 180 / Math.PI);
      num.style.setProperty('--r', Math.max(-1, Math.min(1, dx / (root.getBoundingClientRect().width / 2))).toFixed(3));
    }
    function rest() { root.classList.remove('trk'); num.style.setProperty('--r', '0'); aim(0); }
    function swapText(t: string, s: string) {
      const update = () => { title.textContent = t; sub.textContent = s; root.classList.remove('swap'); };
      if (rm) { update(); return; }
      root.classList.add('swap'); later(update, 250);
    }
    function digits(x: number, y: number, label: string) {
      cols[0].style.setProperty('--v', String(x)); cols[1].style.setProperty('--v', String(y)); num.setAttribute('aria-label', label);
    }
    function finish(i: number) {
      path.textContent = suggestions[i].path;
      root.classList.remove('fixing', 'trk'); root.classList.add('found');
      num.style.setProperty('--r', '0'); digits(2, 0, '200 — đã tìm thấy trang');
      tgt = a - (((a % 360) + 360) % 360) + 720; kick();
      rows[i].querySelector('svg')!.innerHTML = CHECK;
      rows[i].disabled = false;
      swapText('Đã tìm thấy', `Đang chuyển đến ${suggestions[i].label}`);
      busy = false;
      // Let the original 1s roll (+ .12s stagger) and spring spin settle before routing.
      if (rm) { void navigate(suggestions[i].path); }
      else later(() => { void navigate(suggestions[i].path); }, 1600);
    }
    function go(i: number) {
      if (busy || root.classList.contains('found')) return;
      busy = true; selected = i;
      rows.forEach((button, k) => { button.disabled = k !== i; });
      rows[i].classList.add('on'); root.classList.add('fixing');
      if (rm) { finish(i); return; }
      const from = path.textContent || pathname, to = suggestions[i].path;
      let k = from.length;
      function del() {
        if (k > 1) { path.textContent = from.slice(0, --k); later(del, 34); return; }
        let j = 1;
        function type() {
          path.textContent = to.slice(0, ++j);
          if (j < to.length) later(type, 55); else finish(i);
        }
        type();
      }
      del();
    }
    function reset() {
      clearWork(); busy = false; selected = null; a = v = tgt = 0;
      nd.style.transform = 'rotate(0deg)';
      root.classList.remove('found', 'fixing', 'trk', 'swap');
      num.style.setProperty('--r', '0'); path.textContent = pathname;
      digits(4, 4, '404 — không tìm thấy trang');
      title.textContent = 'Có vẻ bạn đã lạc đường'; sub.textContent = 'Địa chỉ bị sai hoặc trang đã được chuyển';
      rows.forEach(button => { button.disabled = false; button.classList.remove('on'); button.querySelector('svg')!.innerHTML = ARROW; });
    }
    reset();
    rows.forEach((button, i) => {
      listen(button, 'click', () => go(i));
      listen(button, 'focus', () => {
        if (busy || root.classList.contains('found')) return;
        root.classList.add('trk'); const r = button.getBoundingClientRect(); toward(r.left + r.width / 2, r.top + r.height / 2);
      });
    });
    listen(root, 'pointermove', event => {
      if (busy || root.classList.contains('found')) return;
      root.classList.add('trk'); const e = event as PointerEvent; toward(e.clientX, e.clientY);
    });
    listen(root, 'pointerleave', () => { if (!root.contains(document.activeElement)) rest(); });
    listen(root, 'focusout', event => {
      if (!root.contains((event as FocusEvent).relatedTarget as Node | null) && !root.matches(':hover')) rest();
    });
    listen(re, 'click', () => { reset(); rows[0].focus({ preventScroll: true }); });
    listen(media, 'change', () => {
      rm = media.matches;
      if (rm) {
        clearWork();
        if (selected !== null) finish(selected); else { a = tgt; v = 0; nd.style.transform = `rotate(${a}deg)`; }
      }
    });
    return () => { active = false; clearWork(); cleanups.forEach(cleanup => cleanup()); };
  }, [pathname, navigate, suggestions]);

  const digit = <span className="u089-d" aria-hidden="true"><span className="u089-col" style={{ '--v': 4 } as CSSProperties}>{[0, 1, 2, 3, 4].map(n => <span key={n}>{n}</span>)}</span></span>;
  return <main className="u089-page"><div className="u089" ref={ref}>
    <div className="u089-url"><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5.6" /><path d="M1.6 7h10.8M7 1.4c1.8 1.6 1.8 9.6 0 11.2M7 1.4c-1.8 1.6-1.8 9.6 0 11.2" /></svg><span title={`${host}${pathname}`}>{host}<b>{pathname}</b></span></div>
    <div className="u089-num" role="img" aria-label="404 — không tìm thấy trang">{digit}
      <span className="u089-cp" aria-hidden="true"><svg viewBox="0 0 72 72"><circle className="u089-ring" cx="36" cy="36" r="30.5" /><path className="u089-tk" d="M36 14v3M36 55v3M14 36h3M55 36h3" /><g className="u089-wob"><g className="u089-nd"><path d="M36 15.5l5.5 20.5h-11z" fill="#E5484D" /><path d="M36 56.5l-5.5-20.5h11z" fill="var(--ux-ink-3)" /></g></g><circle className="u089-hub" cx="36" cy="36" r="3.4" /></svg></span>{digit}
    </div>
    <p className="u089-t" aria-live="polite">Có vẻ bạn đã lạc đường</p>
    <p className="u089-s">Địa chỉ bị sai hoặc trang đã được chuyển</p>
    <div className="u089-lab"><span>Địa chỉ gần nhất</span><button className="u089-re" type="button">Hoàn tác</button></div>
    <ul className="u089-sug">{suggestions.map(p => <li key={p.path}><button className="u089-row" type="button" aria-label={`Đến ${p.path} — ${p.label}, khớp ${Math.round(p.match * 100)}%`}><code>{p.path}</code><small>{p.label}</small><span className="u089-m" aria-hidden="true"><i style={{ '--m': p.match } as CSSProperties} /></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg></button></li>)}</ul>
  </div></main>;
}
