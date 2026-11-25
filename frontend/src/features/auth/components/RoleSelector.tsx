// Lucian UX/UI Prompt #393 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#393
import Icon from '../../../shared/components/Icon';
import type { AuthRole } from '../types/auth';
import '../styles/role-selector.css';

interface RoleSelectorProps {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
  disabled?: boolean;
  allowAdmin?: boolean;
}

function RoleSelector({ value, onChange, disabled, allowAdmin = false }: RoleSelectorProps) {
  return (
    <div
      className="auth-role-selector u393-role"
      data-role={value}
      data-count={allowAdmin ? '3' : '2'}
      role="group"
      aria-label="Vai trò tài khoản"
    >
      <span className="u393-role-pill" aria-hidden="true" />
      <button
        type="button"
        aria-pressed={value === 'buyer'}
        disabled={disabled}
        onClick={() => onChange('buyer')}
      >
        <Icon name="bag" />
        {allowAdmin ? 'Người mua' : 'Người mua (Buyer)'}
      </button>
      <button
        type="button"
        aria-pressed={value === 'seller'}
        disabled={disabled}
        onClick={() => onChange('seller')}
      >
        <Icon name="store" />
        {allowAdmin ? 'Người bán' : 'Người bán (Seller)'}
      </button>
      {allowAdmin && (
        <button
          type="button"
          aria-pressed={value === 'admin'}
          disabled={disabled}
          onClick={() => onChange('admin')}
        >
          <i className="bi bi-shield-lock" aria-hidden="true" />
          Admin
        </button>
      )}
    </div>
  );
}

export default RoleSelector;
