import { Link } from 'react-router-dom';

export default function AuctionHeader() {
  return <header className="sca-page-heading">
    <nav className="sca-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><i className="bi bi-chevron-right" /><Link to="/seller-hub">Kênh Bán Hàng & Đấu Giá</Link><i className="bi bi-chevron-right" /><span>Tạo Phiên Đấu Giá Mới</span></nav>
    <div className="sca-heading-row"><div className="sca-heading-copy"><h1>Tạo Phiên Đấu Giá Sản Phẩm</h1><p>Định cấu hình sản phẩm, giá khởi điểm và thời gian biểu cho phiên đấu giá của bạn.</p></div>
      <div className="sca-stepper" aria-label="Các bước tạo phiên"><span className="is-active"><b>1</b><span>Sản phẩm<small>Đang chọn</small></span></span><i className="bi bi-chevron-right" /><span><b>2</b><span>Quy tắc & Giá<small>Thiết lập phiên</small></span></span><i className="bi bi-chevron-right" /><span><b>3</b><span>Xác nhận<small>Niêm yết</small></span></span></div>
    </div>
  </header>;
}
