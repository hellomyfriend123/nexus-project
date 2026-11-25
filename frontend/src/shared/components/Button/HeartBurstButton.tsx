// Lucian UX/UI Prompt #022 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#022
import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './HeartBurstButton.css';

interface HeartBurstButtonProps {
  pressed: boolean;
  onToggle: () => void;
  className?: string;
  label: string;
  text?: string;
  count?: number;
}

const particles = [
  [0, '#FF4D6D', '#FFB26B'],
  [51, '#8B6CFF', '#FF7A93'],
  [103, '#FFB547', '#22C3A6'],
  [154, '#FF4D6D', '#8B6CFF'],
  [206, '#22C3A6', '#FFB547'],
  [257, '#FF7A93', '#3D8BFF'],
  [309, '#3D8BFF', '#FF4D6D'],
] as const;

function HeartBurstButton({
  pressed,
  onToggle,
  className = '',
  label,
  text,
  count,
}: HeartBurstButtonProps) {
  const [burst, setBurst] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const outgoingRef = useRef<HTMLSpanElement>(null);
  const outgoingAnimation = useRef<Animation | null>(null);
  const gradientId = useId().replace(/:/g, '');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useRef(false);
  const previousCount = useRef(count);
  const countRef = useRef<HTMLSpanElement>(null);
  const countAnimation = useRef<Animation | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotion.current = media.matches;
      if (media.matches) {
        setBurst(false);
        outgoingAnimation.current?.cancel();
        countAnimation.current?.cancel();
      }
    };
    update();
    media.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
      if (timer.current) clearTimeout(timer.current);
      countAnimation.current?.cancel();
      outgoingAnimation.current?.cancel();
    };
  }, []);

  useEffect(() => {
    const oldCount = previousCount.current;
    previousCount.current = count;
    if (
      count === undefined ||
      oldCount === undefined ||
      count === oldCount ||
      reducedMotion.current
    )
      return;
    const element = countRef.current;
    countAnimation.current?.cancel();
    outgoingAnimation.current?.cancel();
    const outgoing = outgoingRef.current;
    if (outgoing) outgoing.textContent = String(oldCount);
    if (outgoing && typeof outgoing.animate === 'function') {
      outgoingAnimation.current = outgoing.animate(
        [
          { transform: 'translateY(0)', opacity: 1 },
          {
            transform: `translateY(${count > oldCount ? -100 : 100}%)`,
            opacity: 0,
          },
        ],
        { duration: 500, easing: 'cubic-bezier(.34,1.45,.64,1)' },
      );
    }
    if (element && typeof element.animate === 'function') {
      countAnimation.current = element.animate(
        [
          {
            transform: `translateY(${count > oldCount ? 100 : -100}%)`,
            opacity: 0,
          },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        { duration: 500, easing: 'cubic-bezier(.34,1.45,.64,1)' },
      );
    }
  }, [count]);

  function handleClick() {
    if (timer.current) clearTimeout(timer.current);
    const shouldAnimate = !pressed && !reducedMotion.current;
    setBurst(shouldAnimate);
    if (shouldAnimate) {
      setBurstKey((key) => key + 1);
      timer.current = setTimeout(() => setBurst(false), 900);
    }
    onToggle();
  }

  return (
    <button
      ref={buttonRef}
      className={`${className} u022${pressed ? ' is-on' : ''}${burst ? ' is-pop' : ''}`}
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={handleClick}
    >
      <span className="u022-icon" aria-hidden="true">
        <span key={burstKey} className="u022-art">
          <span className="u022-ring" />
          {particles.map(([angle, color, second]) => (
            <span
              key={angle}
              className="u022-dot"
              style={
                {
                  '--a': `${angle}deg`,
                  '--c': color,
                  '--c2': second,
                } as CSSProperties
              }
            >
              <i />
              <i />
            </span>
          ))}
          <span className="u022-heart">
            <svg viewBox="0 0 52 52">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--u022-heart-top)" />
                  <stop offset="1" stopColor="var(--u022-heart-bottom)" />
                </linearGradient>
              </defs>
              <path
                className="u022-f"
                fill={`url(#${gradientId})`}
                d="M26 45S5 33 5 18.5C5 11.6 10.4 7 16.4 7c4.3 0 7.6 2.3 9.6 5.6C28 9.3 31.3 7 35.6 7 41.6 7 47 11.6 47 18.5 47 33 26 45 26 45z"
              />
              <path
                className="u022-o"
                d="M26 45S5 33 5 18.5C5 11.6 10.4 7 16.4 7c4.3 0 7.6 2.3 9.6 5.6C28 9.3 31.3 7 35.6 7 41.6 7 47 11.6 47 18.5 47 33 26 45 26 45z"
              />
            </svg>
          </span>
        </span>
      </span>
      {text && <span>{text}</span>}
      {count !== undefined && (
        <span className="u022-roll" aria-live="polite">
          (
          <span className="u022-digits">
            <span ref={countRef}>{count}</span>
            <span
              ref={outgoingRef}
              className="u022-outgoing"
              aria-hidden="true"
            />
          </span>
          )
        </span>
      )}
    </button>
  );
}

export default HeartBurstButton;
