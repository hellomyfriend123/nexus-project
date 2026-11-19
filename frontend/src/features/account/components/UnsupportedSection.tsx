import AccountPage from '../../../shared/components/AccountLayout/AccountPage';

export interface UnsupportedSectionProps {
  title: string;
  /** What the section will do once the backend supports it. */
  description: string;
  /** Concrete backend gap, so the message is verifiable rather than vague. */
  gap: string;
  missingEndpoint: string;
}

/**
 * Honest placeholder for an account section whose backend endpoint does not exist yet.
 *
 * Deliberately renders no form and no save button: a control that appears to work but cannot
 * persist anything would be worse than saying so. The gap text names the missing endpoint so it
 * can be checked against dev/backend and docs/api-gaps.md.
 */
export default function UnsupportedSection({ title, description, gap, missingEndpoint }: UnsupportedSectionProps) {
  return (
    <AccountPage title={title} description={description}>
      <section className="nx-account__form" aria-labelledby="account-unsupported-title">
        <h2 id="account-unsupported-title" className="nx-account__label">Tính năng chưa được hỗ trợ</h2>
        <p className="nx-account__hint">{gap}</p>
        <p className="nx-account__hint">
          Endpoint cần bổ sung ở backend: <code>{missingEndpoint}</code>
        </p>
      </section>
    </AccountPage>
  );
}
