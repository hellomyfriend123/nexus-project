import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../shared/components/Toast';


/** Application-wide providers. Mount once at the React root. */
export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <BrowserRouter>
      <ToastProvider>
        {children}
      </ToastProvider>
    </BrowserRouter>
  );
}
