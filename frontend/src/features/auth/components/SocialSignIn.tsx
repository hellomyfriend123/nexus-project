// Lucian UX/UI Prompt #066 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#066
import { useEffect, useRef, useState } from 'react';
import '../styles/social-sign-in.css';

interface SocialSignInProps {
  onGoogle: () => void;
  disabled?: boolean;
}

function SocialSignIn({ onGoogle, disabled = false }: SocialSignInProps) {
  const [phase, setPhase] = useState<'idle' | 'busy' | 'done'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  const providerRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const done = phase === 'done';

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (done) backRef.current?.focus({ preventScroll: true });
  }, [done]);

  function connect() {
    if (disabled || locked.current || phase !== 'idle') return;
    locked.current = true;
    setPhase('busy');
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    timer.current = setTimeout(
      () => {
        timer.current = null;
        // Presentation only: retain the existing unavailable-OAuth handler.
        onGoogle();
        setPhase('done');
        locked.current = false;
      },
      reduced ? 300 : 1500,
    );
  }

  function reset() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    locked.current = false;
    setPhase('idle');
    providerRef.current?.focus({ preventScroll: true });
  }

  return (
    <div
      className={`u066${phase !== 'idle' ? ' is-pick' : ''}${done ? ' is-done' : ''}`}
      aria-label="Đăng nhập Google"
    >
      <div className="u066-list">
        <div className="u066-it">
          <div>
            <button
              ref={providerRef}
              className={`u066-b${phase === 'busy' ? ' busy' : done ? ' ok' : ''}`}
              type="button"
              disabled={disabled}
              aria-disabled={phase !== 'idle'}
              aria-busy={phase === 'busy'}
              aria-label={
                phase === 'busy'
                  ? 'Đang mô phỏng đăng nhập Google'
                  : done
                    ? 'Hoàn tất mô phỏng Google, chưa kết nối tài khoản'
                    : 'Đăng nhập bằng Google'
              }
              onClick={connect}
            >
              <span className="u066-ic" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
                    fill="#34A853"
                  />
                  <path
                    d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.6z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z"
                    fill="#EA4335"
                  />
                </svg>
              </span>
              <span className="u066-tx">Đăng nhập bằng Google</span>
              <span className="u066-st" aria-hidden="true">
                <i />
                <svg viewBox="0 0 26 26">
                  <path d="M6 13.5l4.5 4.5L20 8.5" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
      <p className="u066-msg" role="status">
        {phase === 'busy'
          ? 'Đang mô phỏng kết nối Google…'
          : done
            ? 'Google OAuth chưa được triển khai. Không tạo phiên đăng nhập.'
            : ''}
      </p>
      <button
        ref={backRef}
        className="u066-back"
        type="button"
        tabIndex={done ? 0 : -1}
        inert={!done}
        aria-hidden={!done}
        onClick={reset}
      >
        Thử lại phương thức Google
      </button>
    </div>
  );
}

export default SocialSignIn;
