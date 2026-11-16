// Lucian UX/UI Prompt #051 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#051
import { useEffect, useRef, useState } from 'react';

function useAddToCartAnimation(onAdded: () => void) {
  const [added, setAdded] = useState(false);
  const [count, setCount] = useState(0);
  const stageRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLButtonElement>(null);
  const badgeRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animations = useRef(new Set<Animation>());
  const flights = useRef(new Set<HTMLElement>());
  const reducedMotion = useRef(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotion.current = media.matches;
      // Finish in-flight additions immediately if the preference changes.
      if (media.matches) {
        animations.current.forEach((animation) => animation.finish());
      }
    };
    update();
    media.addEventListener('change', update);
    const activeAnimations = animations.current;
    const activeFlights = flights.current;
    return () => {
      media.removeEventListener('change', update);
      if (timerRef.current) clearTimeout(timerRef.current);
      activeAnimations.forEach((animation) => animation.cancel());
      activeAnimations.clear();
      activeFlights.forEach((flight) => flight.remove());
      activeFlights.clear();
    };
  }, []);

  function animate(
    element: Element,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    const animation = element.animate(frames, options);
    animations.current.add(animation);
    const release = () => animations.current.delete(animation);
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
    return animation;
  }

  function addToCart() {
    setAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1400);
    const stage = stageRef.current;
    const image = imageRef.current;
    const cart = cartRef.current;
    const land = () => {
      setCount((current) => current + 1);
      onAdded();
      if (!reducedMotion.current && cart && badgeRef.current) {
        animate(
          cart,
          [
            { transform: 'none' },
            { transform: 'rotate(-12deg) scale(1.12)' },
            { transform: 'rotate(8deg)' },
            { transform: 'none' },
          ],
          { duration: 500, easing: 'ease-out' },
        );
        animate(
          badgeRef.current,
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.45)' },
            { transform: 'scale(1)' },
          ],
          { duration: 400, easing: 'cubic-bezier(.34,1.5,.64,1)' },
        );
      }
    };
    if (
      reducedMotion.current ||
      !stage ||
      !image ||
      !cart ||
      typeof image.animate !== 'function'
    ) {
      land();
      return;
    }
    // Clone the existing Nexus illustration, not the sample bottle. Keep SVG IDs unique.
    const fly = document.createElement('div');
    fly.className = 'u051-fly';
    fly.setAttribute('aria-hidden', 'true');
    const clone = image.querySelector('svg')?.cloneNode(true) as
      SVGSVGElement | undefined;
    if (!clone) {
      land();
      return;
    }
    const suffix = `-fly-${crypto.randomUUID()}`;
    clone.querySelectorAll('[id]').forEach((node) => {
      const oldId = node.id;
      const nextId = oldId + suffix;
      node.id = nextId;
      clone.querySelectorAll('[fill], [clip-path]').forEach((target) => {
        for (const attribute of ['fill', 'clip-path']) {
          if (target.getAttribute(attribute) === `url(#${oldId})`)
            target.setAttribute(attribute, `url(#${nextId})`);
        }
      });
    });
    fly.appendChild(clone);
    stage.appendChild(fly);
    flights.current.add(fly);
    const stageRect = stage.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const cartRect = cart.getBoundingClientRect();
    const sx = imageRect.left - stageRect.left + imageRect.width / 2 - 17;
    const sy = imageRect.top - stageRect.top + imageRect.height / 2 - 32;
    const ex = cartRect.left - stageRect.left + cartRect.width / 2 - 17;
    const ey = cartRect.top - stageRect.top + cartRect.height / 2 - 32;
    const frames = Array.from({ length: 13 }, (_, k) => {
      const t = k / 12;
      const x = sx + (ex - sx) * t;
      const y = sy + (ey - sy) * t - Math.sin(t * Math.PI) * 36;
      return {
        transform: `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${t * 40}deg) scale(${(1.2 - t * 0.85).toFixed(2)})`,
        opacity: t > 0.92 ? 0 : 1,
      };
    });
    animate(fly, frames, {
      duration: 720,
      easing: 'cubic-bezier(.5,0,.3,1)',
    }).onfinish = () => {
      fly.remove();
      flights.current.delete(fly);
      land();
    };
  }

  return { added, count, stageRef, imageRef, cartRef, badgeRef, addToCart };
}

export default useAddToCartAnimation;
