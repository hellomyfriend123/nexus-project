import { Link } from 'react-router-dom';
import AccountPage from '../../../shared/components/AccountLayout/AccountPage';
import type { AccountRole } from '../hooks/useAccountProfile';
import { useAccountProfile } from '../hooks/useAccountProfile';

const genderLabels: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };

export default function ProfilePage({ role }: { role: AccountRole }) {
  const account = useAccountProfile(role);

  if (account.loading) {
    return <AccountPage title="Hồ sơ cá nhân"><p className="nx-account__hint" role="status">Đang tải hồ sơ…</p></AccountPage>;
  }
  if (account.loadError) {
    return (
      <AccountPage title="Hồ sơ cá nhân">
        <div className="nx-account__form" role="alert">
          <p className="nx-account__error">{account.loadError}</p>
          <button type="button" className="nx-button nx-button-soft" onClick={account.retry}>Thử lại</button>
        </div>
      </AccountPage>
    );
  }
  if (!account.profile) {
    return (
      <AccountPage title="Hồ sơ cá nhân">
        <div className="nx-account__form">
          <p className="nx-account__hint">Đăng nhập để xem và cập nhật hồ sơ của bạn.</p>
          <Link className="nx-button nx-button-primary" to="/login">Đăng nhập</Link>
        </div>
      </AccountPage>
    );
  }

  return (
    <AccountPage title="Hồ sơ cá nhân" description="Cập nhật tên và thông tin liên hệ dùng khi mua bán.">
      <form
        className="nx-account__form"
        noValidate
        onSubmit={event => { event.preventDefault(); void account.save(); }}
      >
        {/* email/username are login identifiers; the backend refuses to change them here. */}
        <div className="nx-account__field">
          <label htmlFor="account-email">Email đăng nhập</label>
          <input id="account-email" type="email" value={account.profile.email} readOnly disabled />
        </div>

        <div className="nx-account__field">
          <label htmlFor="account-username">Tên đăng nhập</label>
          <input id="account-username" value={account.profile.username} readOnly disabled />
        </div>

        <div className="nx-account__field">
          <label htmlFor="account-full-name">Họ tên</label>
          <input
            id="account-full-name"
            type="text"
            maxLength={150}
            value={account.draft.fullName}
            disabled={account.saving}
            onChange={event => account.update('fullName', event.target.value)}
          />
        </div>

        <div className="nx-account__field">
          <label htmlFor="account-phone">Số điện thoại</label>
          <input
            id="account-phone"
            type="tel"
            value={account.draft.phone}
            disabled={account.saving}
            onChange={event => account.update('phone', event.target.value)}
          />
        </div>

        {/* <div className="nx-account__field">
          <label htmlFor="account-birth">Ngày sinh</label>
          <input
            id="account-birth"
            type="date"
            value={account.draft.dateOfBirth}
            disabled={account.saving}
            onChange={event => account.update('dateOfBirth', event.target.value)}
          />
        </div>

        <div className="nx-account__field">
          <label htmlFor="account-gender">Giới tính</label>
          <select
            id="account-gender"
            value={account.draft.gender}
            disabled={account.saving}
            onChange={event => account.update('gender', event.target.value as '' | 'MALE' | 'FEMALE' | 'OTHER')}
          >
            <option value="">Chưa chọn</option>
            {Object.entries(genderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div> */}

        {account.saveError && <p className="nx-account__error" role="alert">{account.saveError}</p>}
        {account.saved && !account.saveError && <p className="nx-account__status" role="status">Đã lưu hồ sơ.</p>}
        
        <div className="nx-account__actions">
          <button type="submit" className="nx-button nx-button-primary" disabled={account.saving}>
            {account.saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </AccountPage>
  );
}
