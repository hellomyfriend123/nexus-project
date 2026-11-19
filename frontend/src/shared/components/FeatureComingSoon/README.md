# FeatureComingSoon

Nội dung dùng chung cho tính năng đã có kế hoạch nhưng chưa hỗ trợ. Component sử dụng GIF trong `src/assets/animations`, token của `shared/styles/variables.css` và Bootstrap Icons đang có trong ứng dụng; không thêm dependency.

```tsx
import FeatureComingSoon from '../../../shared/components/FeatureComingSoon';

<FeatureComingSoon
  title="Tính năng đổi mật khẩu đang được chuẩn bị"
  description="Chúng tôi đang hoàn thiện chức năng này để bạn quản lý tài khoản thuận tiện hơn."
  action={{ to: '/buyer-hub', label: 'Về tài khoản của tôi' }}
/>
```

- `title`, `description` có nội dung mặc định; `action` tùy chọn. Bỏ `action` nếu chưa có đích điều hướng phù hợp, không dùng link giả.
- Đặt bên trong vùng nội dung của account layout; layout cha sở hữu sidebar, header, footer và phần tử `main`. Component cung cấp heading `h1` của trang.
- Route và kiểm tra quyền thuộc buyer/seller; không gắn route hoặc chuyển hướng tự động trong shared.
- CSS dùng namespace `nx-coming-soon`, không ghi đè input, modal hay heading toàn cục. Nội dung co giãn theo vùng sidebar, mobile giảm padding và kích thước ảnh.
- Ảnh là trang trí. Người dùng có thể ẩn ảnh động; khi bật giảm chuyển động của hệ thống, hiển thị biểu tượng tĩnh thay GIF.
- Chỉ dùng cho tính năng chưa hỗ trợ, không thay thế trạng thái API lỗi, mất quyền hoặc đang tải.
- Không hứa thời điểm ra mắt. Các mục sidebar tương ứng có thể gắn nhãn “Sắp có”.

Hiện chỉ xây thành phần shared, chưa thay route đang hoạt động hoặc triển khai sidebar mới.
