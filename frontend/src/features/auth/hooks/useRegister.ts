import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../../services/api/auth';
import { getAuthErrorFeedback } from '../services/auth.feedback';
import { notify } from '../../../shared/components/Toast';
import { validateRegister } from '../services/register.validation';
import type { RegisterErrors, RegisterInput } from '../types/auth';

export function useRegister(fields: readonly { name: Exclude<keyof RegisterInput, 'role'> }[]) {
  const [values, setValues] = useState<RegisterInput>({
    username: '',
    phone: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [notice, setNotice] = useState('');
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'idle' | 'busy' | 'ok'>('idle');
  const locked = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const busy = phase === 'busy';
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    setNotice('');
    const firstInvalid = fields.find((field) => nextErrors[field.name]);
    if (firstInvalid) {
      setShake(true);
      event.currentTarget
        .querySelector<HTMLInputElement>(`#register-${firstInvalid.name}`)
        ?.focus();
      return;
    }
    setShake(false);
    locked.current = true;
    setPhase('busy');
    controller.current = new AbortController();
    const signal = controller.current.signal;
    try {
      await register(values, signal);
      if (signal.aborted) return;
      setPhase('ok');
      setValues((current) => ({ ...current, password: '', confirmPassword: '' }));
      notify.success('Đăng ký thành công.', { toastId: 'auth-register-success' });
      setNotice('Bạn có thể đăng nhập bằng tài khoản vừa tạo.');
    } catch (error) {
      if (signal.aborted) return;
      setPhase('idle');
      setShake(true);
      const feedback = getAuthErrorFeedback(error, 'register');
      if (feedback.kind === 'fields') {
        setErrors(feedback.errors);
      } else if (feedback.kind === 'toast') {
        notify.error(feedback.message, { toastId: 'auth-register-error' });
      } else if (feedback.kind === 'notice') {
        setNotice(feedback.message);
      }
    } finally {
      if (!signal.aborted) locked.current = false;
    }
  }

  return { values, setValues, errors, setErrors, notice, setNotice, shake, setShake, navigate, phase, setPhase, busy, handleSubmit };
}
