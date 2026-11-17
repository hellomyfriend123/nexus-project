import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { beginGoogleSignIn, clearSession, login } from '../../../services/api/auth';
import { getAuthErrorFeedback } from '../services/auth.feedback';
import { notify } from '../../../shared/components/Toast';
import type { AuthRole } from '../types/auth';

export function useSignIn() {
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
        : 'Vui lòng nhập email.',
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
      const [session] = await Promise.all([
        login({ identifier, password, role }, remember, controller.current.signal),
        wait(reduced ? 0 : 1100),
      ]);
      if (request.current !== id) return;
      setPassword('');
      setPhase('ok');
      await wait(reduced ? 0 : 650);
      if (request.current === id) {
        setPhase('welcome');
        navigate(session.roles.includes('ADMIN') ? '/admin' : role === 'seller' ? '/seller-hub' : '/buyer-hub');
      }
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

  function signInWithGoogle() {
    try { window.location.assign(beginGoogleSignIn(role, remember)); }
    catch { notify.error('Please enable browser storage and retry Google sign-in.'); }
  }

  return { role, setRole, identifier, setIdentifier, password, setPassword, remember, setRemember, shown, setShown, caps, setCaps, phase, errors, notice, setNotice, shake, setShake, passwordRef, identifierRef, backRef, busy, welcome, navigate, clearFeedback, handleSubmit, resetAccount, signInWithGoogle };
}
