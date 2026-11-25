// Lucian UX/UI Prompt #049 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#049
import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';

// Motion-only adaptation: preserve the card's existing links and click handlers.
function useProductCardMotion() {
  const cardRef = useRef<HTMLElement>(null);
  const reducedMotion = useRef(false);

  function resetPosition() {
    cardRef.current?.style.setProperty('--px', '0');
    cardRef.current?.style.setProperty('--py', '0');
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotion.current = media.matches;
      if (media.matches) resetPosition();
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' || reducedMotion.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    event.currentTarget.style.setProperty(
      '--px',
      (((event.clientX - bounds.left) / bounds.width) * 2 - 1).toFixed(3),
    );
    event.currentTarget.style.setProperty(
      '--py',
      (((event.clientY - bounds.top) / bounds.height) * 2 - 1).toFixed(3),
    );
  }

  return { cardRef, onPointerMove, onPointerLeave: resetPosition };
}

export default useProductCardMotion;
