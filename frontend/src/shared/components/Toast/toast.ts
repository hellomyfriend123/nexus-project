import type { ReactNode } from 'react';

export type ToastId = string | number;
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export interface ToastOptions {
  toastId?: ToastId;
  autoClose?: number | false;
  role?: 'status' | 'alert';
  title?: ReactNode;
  action?: { label: string; onClick: () => void };
}
export interface ToastUpdateOptions extends ToastOptions {
  render?: ReactNode;
  type?: ToastType;
  isLoading?: boolean;
}
export interface ToastRecord extends ToastOptions {
  id: ToastId;
  message: ReactNode;
  type: ToastType;
  leaving: boolean;
}
const EMPTY: readonly ToastRecord[] = [];
let entries: readonly ToastRecord[] = EMPTY;
let sequence = 0;
const listeners = new Set<() => void>();
function emit() { listeners.forEach(listener => listener()); }
function add(type: ToastType, message: ReactNode, options: ToastOptions = {}): ToastId {
  const id = options.toastId ?? `toast-${++sequence}`;
  if (entries.some(entry => entry.id === id)) return id;
  entries = [{ ...options, id, message, type, leaving: false, autoClose: options.autoClose ?? (type === 'error' || type === 'loading' ? false : 4500) }, ...entries];
  emit();
  return id;
}
export const toastStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => entries,
  getServerSnapshot: () => EMPTY,
  remove(id: ToastId) { entries = entries.filter(entry => entry.id !== id); emit(); },
};
/** Pass a toastId in options when repeated events should share one notification. */
export const notify = {
  success: (message: ReactNode, options?: ToastOptions) => add('success', message, options),
  error: (message: ReactNode, options?: ToastOptions) => add('error', message, options),
  warning: (message: ReactNode, options?: ToastOptions) => add('warning', message, options),
  info: (message: ReactNode, options?: ToastOptions) => add('info', message, options),
  loading: (message: ReactNode, options?: ToastOptions) => add('loading', message, options),
  dismiss(id?: ToastId) {
    entries = entries.map(entry => id === undefined || entry.id === id ? { ...entry, leaving: true } : entry);
    emit();
  },
  update(id: ToastId, options: ToastUpdateOptions) {
    entries = entries.map(entry => {
      if (entry.id !== id || entry.leaving) return entry;
      const type = options.type ?? (options.isLoading === false && entry.type === 'loading' ? 'info' : entry.type);
      return { ...entry, ...options, type, message: options.render === undefined ? entry.message : options.render,
        autoClose: options.autoClose ?? (type === 'loading' || type === 'error' ? false : entry.type === 'loading' || entry.type === 'error' ? 4500 : entry.autoClose) };
    });
    emit();
  },
  async promise<T>(task: Promise<T> | (() => Promise<T>), messages: {
    pending: ReactNode; success: ReactNode | ((value: T) => ReactNode); error: ReactNode | ((reason: unknown) => ReactNode);
  }, options?: ToastOptions): Promise<T> {
    const id = add('loading', messages.pending, options);
    try {
      const value = await (typeof task === 'function' ? task() : task);
      notify.update(id, { type: 'success', render: typeof messages.success === 'function' ? messages.success(value) : messages.success, autoClose: options?.autoClose ?? 4500 });
      return value;
    } catch (reason) {
      notify.update(id, { type: 'error', render: typeof messages.error === 'function' ? messages.error(reason) : messages.error, autoClose: false });
      throw reason;
    }
  },
};
