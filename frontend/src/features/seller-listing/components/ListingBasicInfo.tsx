import type { CreateListingState } from '../hooks/useCreateListing';
export default function ListingBasicInfo({ hub }: { hub: CreateListingState }) {
  return <div className="nx-listing-stack">
    <div><label htmlFor="listing-title" className="nx-listing-label">Tên sản phẩm <em>*</em></label><div className="nx-listing-input-wrap"><input id="listing-title" required maxLength={hub.titleMax} value={hub.draft.title} placeholder="Nhập tên sản phẩm" onChange={event => hub.updateDraft('title', event.target.value)} /><span className="nx-listing-counter">{hub.titleLength}/{hub.titleMax}</span></div></div>
    <div className="nx-listing-two-col"><div><label htmlFor="listing-category" className="nx-listing-label">Danh mục <em>*</em></label><div className="nx-listing-select"><select id="listing-category" required value={hub.category} onChange={event => hub.setCategory(event.target.value)}><option value="">Chọn danh mục</option>{hub.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div></div><div><label htmlFor="listing-sku" className="nx-listing-label">Mã SKU <em>*</em></label><div className="nx-listing-input-wrap"><input id="listing-sku" required maxLength={100} value={hub.draft.sku} placeholder="VD: SP-001" onChange={event => hub.updateDraft('sku', event.target.value)} /></div></div></div>
  </div>;
}
