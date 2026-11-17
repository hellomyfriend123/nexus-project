import { useId } from 'react';
import { Link } from 'react-router-dom';
import type { SellerHubState } from '../hooks/useSellerHub';
export default function QuickListing({ hub }: { hub: SellerHubState }) {
  const uploadId = useId();
  return <section className="nx-seller-card nx-seller-listing" aria-labelledby="quick-listing-title">
    <Link className="nx-seller-button" to="/seller/products/new"><i className="bi bi-plus-circle" aria-hidden="true" /> Đăng bán sản phẩm mới</Link>
    <div className="nx-seller-section-heading"><div><h2 id="quick-listing-title">Đăng bán nhanh (Quick Listing Engine)</h2><p>Tạo mới mã sản phẩm SKU nhanh chóng trong vòng 30 giây để đưa lên kệ sàn Nexus.</p></div><button className="nx-seller-text-button" aria-expanded={!hub.collapsed} aria-controls="seller-listing-form" onClick={() => hub.setCollapsed(!hub.collapsed)}><i className="bi bi-sliders2" aria-hidden="true" /> {hub.collapsed ? 'Mở rộng form' : 'Rút gọn form'}</button></div>
    {!hub.collapsed && <form id="seller-listing-form" onSubmit={event => { event.preventDefault(); hub.submitListing(); }}>
      <div className="nx-seller-listing-fields"><label>Tên sản phẩm niêm yết *<input ref={hub.nameRef} required maxLength={150} placeholder="Ví dụ: Bàn phím cơ Leopold FC980C..." value={hub.draft.name} onChange={event => hub.updateDraft('name', event.target.value)} /></label>
        <label>Danh mục hàng hóa *<select value={hub.draft.category} onChange={event => hub.updateDraft('category', event.target.value)}><option value="">Chọn danh mục</option>{hub.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Giá bán lẻ (VND) *<input type="number" required min="1" step="1" placeholder="3.500.000" value={hub.draft.price} onChange={event => hub.updateDraft('price', event.target.value)} /></label>
        <label>Tồn kho<input type="number" required min="0" step="1" value={hub.draft.stock} onChange={event => hub.updateDraft('stock', event.target.value)} /></label>
        <button className="nx-seller-button" type="submit" disabled={hub.busy}><i className="bi bi-upload" aria-hidden="true" /> Lưu & Đăng</button></div>
      <div className="nx-seller-listing-options"><label><input type="checkbox" checked={hub.draft.buyNow} onChange={event => hub.updateDraft('buyNow', event.target.checked)} /> Kích hoạt tính năng “Mua Ngay (Buy It Now)”</label><label><input type="checkbox" checked={hub.draft.makeOffer} onChange={event => hub.updateDraft('makeOffer', event.target.checked)} /> Bật tính năng trả giá (Make Offer)</label>
        <label className="nx-seller-upload" htmlFor={uploadId}><i className="bi bi-card-image" aria-hidden="true" /> {hub.imageNames.length ? `Đã chọn ${hub.imageNames.length}/12 ảnh` : 'Tải lên ảnh mẫu SKU (Tối đa 12 ảnh)'}</label><input className="nx-seller-file-input" id={uploadId} type="file" accept="image/*" multiple onChange={event => { const files = Array.from(event.target.files ?? []); if (files.length > 12) { hub.mockAction('Chỉ chọn tối đa 12 ảnh'); event.target.value = ''; return; } hub.mockAction('Tải ảnh: backend chưa có endpoint upload'); }} /></div>
    </form>}
  </section>;
}
