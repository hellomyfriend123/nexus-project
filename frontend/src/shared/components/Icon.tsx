import type { ReactNode, SVGProps } from 'react';

type IconName =
  | 'shield'
  | 'bag'
  | 'store'
  | 'user'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'arrow'
  | 'alert'
  | 'check'
  | 'warning'
  | 'close';
interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

const paths: Record<IconName, ReactNode> = {
  shield: (
    <>
      <path d="M12 3 5 6v5c0 5 7 10 7 10s7-5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  bag: (
    <>
      <path d="M5 7h14v14H5zM9 9V5a3 3 0 0 1 6 0v4" />
    </>
  ),
  store: (
    <>
      <path d="M4 10v11h16V10M3 10l2-7h14l2 7M3 10c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0M8 3l-1 7m5-7v7m4-7 1 7" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M5 21v-3c0-5 14-5 14 0v3H5Z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="1" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="m3 3 18 18M10 5c7-2 12 7 12 7s-2 3-5 5M6 6c-3 2-4 6-4 6s4 7 10 7c2 0 3 0 4-1" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6m0 3v1" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m7 12 3 3 7-7" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 10 18H2L12 3Zm0 6v5m0 3v1" />
    </>
  ),
  close: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 8 8 8m0-8-8 8" />
    </>
  ),
};

function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export default Icon;
