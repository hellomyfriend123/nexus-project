import { Link } from 'react-router-dom';
import AccountPage from '../../../shared/components/AccountLayout/AccountPage';
import { ADDRESS_MAX } from '../../../services/api/buyer';
import { useAccountProfile, type AccountRole } from '../hooks/useAccountProfile';

/**
 * Shipping address editor.
 *
 * The backend stores exactly one address: a single `users.address` string (max 255) written
 * through PUT .../profile. There is no address entity, so this page deliberately offers one
 * text field — no address book, no default-address switch.
 */
export default function AddressPage({ role }: { role: AccountRole }) {
  const account = useAccountProfile(role);

  if (account.loading) {
    return <AccountPage title="Địa chỉ nhận hàng"><p className="nx-account__hint" role="status">Đang tải địa chỉ…</p></AccountPage>;
  }
  if (account.loadError) {
    return (
      <AccountPage title="Địa chỉ nhận hàng">
        <div className="nx-account__form" role="alert">
          <p className="nx-account__error">{account.loadError}</p>
          <button type="button" className="nx-button nx-button-soft" onClick={account.retry}>Thử lại</button>
        </div>
      </AccountPage>
    );
  }
  if (!account.profile) {
    return (
      <AccountPage title="Địa chỉ nhận hàng">
        <div className="nx-account__form">
          <p className="nx-account__hint">Đăng nhập để lưu địa chỉ nhận hàng.</p>
          <Link className="nx-button nx-button-primary" to="/login">Đăng nhập</Link>
        </div>
      </AccountPage>
    );
  }

  const remaining = ADDRESS_MAX - account.draft.address.trim().length;

  return (
    <AccountPage title="Địa chỉ nhận hàng" description="Địa chỉ này được điền sẵn khi bạn đặt hàng.">
      <form
        className="nx-account__form"
        noValidate
        onSubmit={event => { event.preventDefault(); void account.save(); }}
      >
        <div className="nx-account__field">
          <label htmlFor="account-address">Địa chỉ</label>
          <textarea
            id="account-address"
            rows={3}
            maxLength={ADDRESS_MAX}
            value={account.draft.address}
            disabled={account.saving}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
            onChange={event => account.update('address', event.target.value)}
          />
          <p className="nx-account__hint">Còn {remaining} ký tự. Để trống để xoá địa chỉ đã lưu.</p>
        </div>
        {account.saveError && <p className="nx-account__error" role="alert">{account.saveError}</p>}
        {account.saved && !account.saveError && <p className="nx-account__status" role="status">Đã lưu địa chỉ.</p>}
        <div className="nx-account__actions">
          <button type="submit" className="nx-button nx-button-primary" disabled={account.saving}>
            {account.saving ? 'Đang lưu…' : 'Lưu địa chỉ'}
          </button>
        </div>
      </form>
    </AccountPage>
  );
}
