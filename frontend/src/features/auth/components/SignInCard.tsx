// Lucian UX/UI Prompt #062 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#062
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import NexusLogo from '../../../shared/components/Logo/NexusLogo';
import RoleSelector from './RoleSelector';
import SocialSignIn from './SocialSignIn';
import { clearSession, getSession, login, adminAccount, loginAsMockAdmin } from '../services/auth.api';
import { getAuthErrorFeedback } from '../services/auth.feedback';
import { notify } from '../../../shared/components/Toast';
import type { AuthRole } from '../types/auth';
import '../styles/sign-in-card.css';

function SignInCard() {
  const [role, setRole] = useState<AuthRole>('buyer');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'busy' | 'ok' | 'welcome'>(
    'idle',
  );
  const [errors, setErrors] = useState({ identifier: '', password: '' });
  const [notice, setNotice] = useState('');
  const [shake, setShake] = useState(false);
  const failedField = useRef<'identifier' | 'password' | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const identifierRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const request = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const focusPasswordOnReset = useRef(false);
  const timers = useRef(new Map<ReturnType<typeof setTimeout>, () => void>());
  const busy = phase === 'busy' || phase === 'ok';
  const welcome = phase === 'welcome';
  const navigate = useNavigate();

  useEffect(
    () => () => {
      request.current += 1;
      controller.current?.abort();
      timers.current.forEach((resolve, timer) => {
        clearTimeout(timer);
        resolve();
      });
      timers.current.clear();
    },
    [],
  );
  useEffect(() => {
    if (welcome) backRef.current?.focus({ preventScroll: true });
    else if (focusPasswordOnReset.current) {
      focusPasswordOnReset.current = false;
      passwordRef.current?.focus({ preventScroll: true });
    }
  }, [welcome]);

  useEffect(() => {
    if (phase !== 'idle' || !failedField.current) return;
    const field = failedField.current;
    failedField.current = null;
    const input =
      field === 'identifier' ? identifierRef.current : passwordRef.current;
    input?.focus();
    if (field === 'password') input?.select();
  }, [phase]);

  function wait(ms: number) {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        resolve();
      }, ms);
      timers.current.set(timer, resolve);
    });
  }
  function clearFeedback() {
    setErrors({ identifier: '', password: '' });
    setNotice('');
    setShake(false);
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    clearFeedback();
    const nextErrors = {
      identifier: identifier.trim()
        ? ''
        : 'Vui lòng nhập tên đăng nhập, email.',
      password: password ? '' : 'Vui lòng nhập mật khẩu.',
    };
    setErrors(nextErrors);
    if (nextErrors.identifier || nextErrors.password) {
      (nextErrors.identifier ? identifierRef : passwordRef).current?.focus();
      return;
    }
    const id = ++request.current;
    controller.current?.abort();
    controller.current = new AbortController();
    busyRef.current = true;
    setPhase('busy');
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    try {
      await Promise.all([
        login({ identifier, password, role }, remember, controller.current.signal),
        wait(reduced ? 0 : 1100),
      ]);
      if (request.current !== id) return;
      setPassword('');
      setPhase('ok');
      await wait(reduced ? 0 : 650);
      if (request.current === id) setPhase('welcome');
    } catch (error) {
      if (request.current === id) {
        setPhase('idle');
        setShake(true);
        const feedback = getAuthErrorFeedback(error, 'login');
        if (feedback.kind === 'credentials') {
          setErrors({ identifier: '', password: feedback.message });
          failedField.current = 'password';
        } else {
          if (feedback.kind === 'toast') {
            notify.error(feedback.message, { toastId: 'auth-login-error' });
          } else if (feedback.kind === 'notice') {
            setNotice(feedback.message);
          }
        }
      }
    } finally {
      if (request.current === id) busyRef.current = false;
    }
  }
  function resetAccount() {
    request.current += 1;
    controller.current?.abort();
    clearSession();
    busyRef.current = false;
    focusPasswordOnReset.current = true;
    setPhase('idle');
    setPassword('');
    setShown(false);
    setCaps(false);
    clearFeedback();
  }

  return (
    <section
      className={`u062${shake ? ' shake' : ''}${welcome ? ' is-in' : ''}`}
      aria-label="Đăng nhập Nexus"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setShake(false);
      }}
    >
      <form
        className="u062-pane u062-login"
        onSubmit={handleSubmit}
        noValidate
        inert={welcome}
        aria-hidden={welcome}
        aria-busy={busy}
        aria-labelledby="login-title"
      >
        <NexusLogo playLoginIntro />
        <h3 id="login-title">Chào mừng trở lại</h3>
        <RoleSelector
          value={role}
          disabled={busy}
          onChange={(value) => {
            setRole(value);
            clearFeedback();
          }}
        />
        <div className={`u062-f${errors.identifier ? ' bad' : ''}`}>
          <label htmlFor="login-identifier">
            Tên đăng nhập / Email
          </label>
          <div className="u062-box">
            <input
              ref={identifierRef}
              id="login-identifier"
              name="username"
              autoComplete="username"
              maxLength={255}
              placeholder="Tên đăng nhập, email hoặc số điện thoại"
              value={identifier}
              disabled={busy}
              onChange={(event) => {
                setIdentifier(event.target.value);
                clearFeedback();
              }}
              aria-invalid={!!errors.identifier}
              aria-describedby={
                errors.identifier ? 'identifier-error' : undefined
              }
            />
          </div>
          <div className="u062-err">
            <span id="identifier-error" role="alert">
              {errors.identifier}
            </span>
          </div>
        </div>
        <div className={`u062-f u062-pw${errors.password ? ' bad' : ''}`}>
          <label htmlFor="login-password">Mật khẩu</label>
          <span className={`u062-caps${caps ? ' on' : ''}`} aria-live="polite">
            {caps ? 'Caps Lock đang bật' : ''}
          </span>
          <div className="u062-box">
            <input
              ref={passwordRef}
              id="login-password"
              name="password"
              type={shown ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              maxLength={128}
              value={password}
              disabled={busy}
              onChange={(event) => {
                setPassword(event.target.value);
                clearFeedback();
              }}
              onKeyUp={(event) => setCaps(event.getModifierState('CapsLock'))}
              onKeyDown={(event) => setCaps(event.getModifierState('CapsLock'))}
              onBlur={() => setCaps(false)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              className="u062-eye"
              aria-pressed={shown}
              aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShown(!shown)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <g className="u062-lid">
                  <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                  <circle cx="12" cy="12" r="3" />
                </g>
                <path className="u062-slash" d="M4 4l16 16" />
              </svg>
            </button>
          </div>
          <div className="u062-err">
            <span id="password-error" role="alert">
              {errors.password}
            </span>
          </div>
        </div>
        <label className="u062-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          Ghi nhớ đăng nhập trên thiết bị này
        </label>
        <div className="u062-row">
          <button
            type="button"
            onClick={() =>
              setNotice('Quên mật khẩu chưa được triển khai trong bản UI này.')
            }
          >
            Quên mật khẩu?
          </button>
        </div>
        {notice && (
          <p className="u062-notice" role="status">
            {notice}
          </p>
        )}
        <button
          className={`u062-go${phase === 'busy' ? ' busy' : phase === 'ok' ? ' ok' : ''}`}
          type="submit"
          disabled={busy}
          aria-label={
            phase === 'busy'
              ? 'Đang kiểm tra đăng nhập'
              : phase === 'ok'
                ? 'Đăng nhập thành công'
                : 'Đăng nhập'
          }
        >
          <span>Đăng nhập</span>
          <i aria-hidden="true" />
          <svg viewBox="0 0 26 26" aria-hidden="true">
            <path d="M6 13.5l4.5 4.5L20 8.5" />
          </svg>
        </button>
        <SocialSignIn
          disabled={busy}
          onGoogle={() =>
            notify.info('Đăng nhập Google chưa được triển khai trong bản UI này.', { toastId: 'auth-google-unavailable' })
          }
        />
        <p className="u062-register">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="u062-register-btn"
          >
            Đăng ký
          </button>
        </p>
        <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '12px', textAlign: 'center' }}>
          <span style={{ color: '#64748b' }}>Tài khoản Admin kiểm thử: </span>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: '#315bf4', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            onClick={() => {
              setIdentifier(adminAccount.email);
              setPassword(adminAccount.password);
              clearFeedback();
            }}
          >
            Điền nhanh
          </button>
          {' | '}
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            onClick={() => {
              loginAsMockAdmin(true);
              navigate('/admin');
            }}
          >
            Vào thẳng /admin ⚡
          </button>
        </div>
      </form>
      <div
        className="u062-pane u062-hi"
        aria-hidden={!welcome}
        inert={!welcome}
      >
        <span className="u062-av" aria-hidden="true" />
        <h3>Chào mừng đến Nexus</h3>
        <p>
          Đăng nhập thành công. Phiên đăng nhập của bạn đã được tạo.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '10px' }}>
          {getSession()?.roles?.includes('ADMINISTRATOR') && (
            <button
              type="button"
              className="btn btn-primary w-100"
              style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}
              onClick={() => navigate('/admin')}
            >
              <i className="bi bi-speedometer2 me-1"></i> Truy cập Admin Portal (/admin)
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline-secondary w-100"
            style={{ padding: '8px 16px', borderRadius: '8px' }}
            onClick={() => navigate('/')}
          >
            Vào trang chủ Sàn Nexus
          </button>
        </div>
        <button
          ref={backRef}
          type="button"
          tabIndex={welcome ? 0 : -1}
          onClick={resetAccount}
        >
          Dùng tài khoản khác
        </button>
      </div>
    </section>
  );
}

export default SignInCard;
