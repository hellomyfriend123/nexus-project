import FeatureComingSoon from '../../shared/components/FeatureComingSoon';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function ComingSoonPreviewPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px 16px',
        background: 'var(--nx-background)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <FeatureComingSoon
          title="Tính năng đang được chuẩn bị"
          description="Chúng tôi đang hoàn thiện tính năng này. Bạn quay lại sau nhé!"
          action={{ to: '/', label: 'Về trang chủ' }}
        />
      </div>
    </main>
  );
}