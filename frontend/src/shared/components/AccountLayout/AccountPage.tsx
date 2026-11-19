import type { ReactNode } from 'react';

export interface AccountPageProps {
  title: string;
  description?: string;
  /** Optional inline actions placed beside the title. */
  actions?: ReactNode;
  children: ReactNode;
}

/** Heading block shared by every account section so buyer and seller read the same. */
export default function AccountPage({ title, description, actions, children }: AccountPageProps) {
  return (
    <main className="nx-account__page">
      <header className="nx-account__heading">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </main>
  );
}
