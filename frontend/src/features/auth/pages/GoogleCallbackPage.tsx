import { Link } from 'react-router-dom';
import { useGoogleCallback } from '../hooks/useGoogleCallback';

function GoogleCallbackPage() {
  const { failed } = useGoogleCallback();
  return <main className="u062-page">
    <section className="bg-white rounded-4 p-5" aria-label="Đăng nhập Google">
      <h1 className="h4">Đăng nhập Google</h1>
      {failed ? <><p role="alert">Không thể đăng nhập Google. Yêu cầu có thể đã bị hủy, hết hạn hoặc tài khoản không có vai trò đã chọn. Vui lòng thử lại.</p><Link to="/login" replace>Quay lại đăng nhập</Link></> : <p role="status">Đang xác thực đăng nhập…</p>}
    </section>
  </main>;
}
export default GoogleCallbackPage;
