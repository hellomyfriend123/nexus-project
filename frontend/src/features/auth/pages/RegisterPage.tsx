// Lucian UX/UI Prompt #062 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#062
import { useState } from 'react';
import { useRegister } from '../hooks/useRegister';
import NexusLogo from '../../../shared/components/Logo/NexusLogo';
import RoleSelector from '../components/RoleSelector';
import '../styles/sign-in-card.css';
import '../styles/register-card.css';

const fields = [
  { name: 'username', label: 'Tên đăng nhập', autoComplete: 'username', placeholder: 'Tên đăng nhập từ 3 đến 50 ký tự' },
  { name: 'phone', label: 'Số điện thoại (không bắt buộc)', autoComplete: 'tel', placeholder: '+84901234567' },
  {
    name: 'fullName',
    label: 'Họ và tên',
    autoComplete: 'name',
    placeholder: 'Nhập họ và tên',
  },
  {
    name: 'email',
    label: 'Email',
    autoComplete: 'email',
    placeholder: 'Nhập địa chỉ email',
  },
  {
    name: 'password',
    label: 'Mật khẩu',
    autoComplete: 'new-password',
    placeholder: 'Tạo mật khẩu từ 8 đến 72 ký tự',
  },
  {
    name: 'confirmPassword',
    label: 'Xác nhận mật khẩu',
    placeholder: 'Nhập lại mật khẩu',
    autoComplete: 'new-password',
  },
] as const;

function RegisterPage() {
  const [visible, setVisible] = useState({
    password: false,
    confirmPassword: false,
  });
  const { values, setValues, errors, setErrors, notice, setNotice, shake, setShake, navigate, phase, setPhase, busy, handleSubmit } = useRegister(fields);

  return (
    <main className="u062-page">
      <section
        className={`u062 u062-register-card${shake ? ' shake' : ''}`}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setShake(false);
        }}
        aria-labelledby="register-title"
      >
        <div className="u062-pane u062-register-pane">
          <header>
            <NexusLogo />
            <h3 id="register-title">Tạo tài khoản Nexus</h3>
            <p>Chọn vai trò và nhập thông tin để bắt đầu đăng ký.</p>
          </header>
          <RoleSelector
            value={values.role}
            disabled={busy}
            onChange={(role) => {
              setPhase('idle');
              setValues((current) => ({ ...current, role }));
              setNotice('');
            }}
          />
          <form onSubmit={handleSubmit} noValidate aria-busy={busy}>
            {fields.map((field) => {
              const name = field.name;
              const isPassword =
                name === 'password' || name === 'confirmPassword';
              const shown = isPassword && visible[name];
              const errorId = `register-${name}-error`;
              return (
                <div
                  className={`u062-f${errors[name] ? ' bad' : ''}`}
                  key={name}
                >
                  <label htmlFor={`register-${name}`}>{field.label}</label>
                  <div className="u062-box">
                    <input
                      id={`register-${name}`}
                      name={name}
                      type={
                        isPassword
                          ? shown
                            ? 'text'
                            : 'password'
                          : name === 'phone' ? 'tel' : name === 'email'
                            ? 'email'
                            : 'text'
                      }
                      autoComplete={field.autoComplete}
                      placeholder={field.placeholder}
                      disabled={busy}
                      required={name !== 'phone'}
                      minLength={isPassword ? 8 : name === 'username' ? 3 : undefined}
                      maxLength={isPassword ? 72 : name === 'username' ? 50 : name === 'fullName' ? 150 : name === 'email' ? 255 : 20}
                      value={values[name]}
                      onChange={(event) => {
                        setPhase('idle');
                        setValues((current) => ({
                          ...current,
                          [name]: event.target.value,
                        }));
                        setErrors((current) => ({
                          ...current,
                          [name]: undefined,
                        }));
                        setNotice('');
                      }}
                      aria-invalid={!!errors[name]}
                      aria-describedby={
                        [
                          errors[name] ? errorId : '',
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined
                      }
                    />
                    {isPassword && (
                      <button
                        type="button"
                        className="u062-eye"
                        aria-label={`${shown ? 'Ẩn' : 'Hiện'} ${field.label.toLowerCase()}`}
                        aria-pressed={shown}
                        onClick={() =>
                          setVisible((current) => ({
                            ...current,
                            [name]: !current[name],
                          }))
                        }
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <g className="u062-lid">
                            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                            <circle cx="12" cy="12" r="3" />
                          </g>
                          <path className="u062-slash" d="M4 4l16 16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="u062-err">
                    <span id={errorId} role="alert">
                      {errors[name]}
                    </span>
                  </div>
                </div>
              );
            })}
            <button
              type="submit"
              className={`u062-go${phase === 'busy' ? ' busy' : phase === 'ok' ? ' ok' : ''}`}
              disabled={busy || phase === 'ok'}
              aria-label={
                busy
                  ? 'Đang kiểm tra thông tin đăng ký'
                  : phase === 'ok'
                    ? 'Tạo tài khoản thành công'
                    : 'Đăng ký'
              }
            >
              <span>Đăng ký</span>
              <i aria-hidden="true" />
              <svg viewBox="0 0 26 26" aria-hidden="true">
                <path d="M6 13.5l4.5 4.5L20 8.5" />
              </svg>
            </button>
          </form>
          {notice && (
            <p className="u062-notice" role="status">
              {notice}
            </p>
          )}

          <p className="u062-register">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="u062-register-btn"
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
