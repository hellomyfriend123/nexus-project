// Lucian UX/UI Prompt #393 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#393
import Icon from '../../../shared/components/Icon';
import type { AuthRole } from '../types/auth';
import '../styles/role-selector.css';

interface RoleSelectorProps {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
  disabled?: boolean;
}

function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <div
      className="auth-role-selector u393-role"
      data-role={value}
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
        Người mua (Buyer)
      </button>
      <button
        type="button"
        aria-pressed={value === 'seller'}
        disabled={disabled}
        onClick={() => onChange('seller')}
      >
        <Icon name="store" />
        Người bán (Seller)
      </button>
    </div>
  );
}

export default RoleSelector;
