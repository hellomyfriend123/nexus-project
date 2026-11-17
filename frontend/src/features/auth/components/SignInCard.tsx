// Lucian UX/UI Prompt #062 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#062
import { useSignIn } from '../hooks/useSignIn';
import NexusLogo from '../../../shared/components/Logo/NexusLogo';
import RoleSelector from './RoleSelector';
import SocialSignIn from './SocialSignIn';
import '../styles/sign-in-card.css';

function SignInCard() {
  const { role, setRole, identifier, setIdentifier, password, setPassword, remember, setRemember, shown, setShown, caps, setCaps, phase, errors, notice, setNotice, shake, setShake, passwordRef, identifierRef, backRef, busy, welcome, navigate, clearFeedback, handleSubmit, resetAccount, signInWithGoogle } = useSignIn();

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
            Email
          </label>
          <div className="u062-box">
            <input
              ref={identifierRef}
              id="login-identifier"
              name="email"
              autoComplete="username"
              maxLength={255}
              placeholder="Email"
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
          onGoogle={signInWithGoogle}
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
