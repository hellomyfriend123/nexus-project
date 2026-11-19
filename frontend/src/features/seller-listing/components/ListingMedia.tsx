import { useRef } from 'react';
import type { CreateListingState } from '../hooks/useCreateListing';
export default function ListingMedia({ hub }: { hub: CreateListingState }) {
  const input = useRef<HTMLInputElement>(null);
  return <div><input ref={input} type="file" accept="image/*" multiple hidden aria-label="Chọn ảnh sản phẩm" onChange={event => { hub.addMedia(Array.from(event.target.files ?? [])); event.target.value = ''; }} /><div className="nx-listing-media-grid">
    {hub.media.map(slot => <figure key={slot.id} className="nx-listing-media"><img src={slot.image} alt={slot.label} />{slot.cover && <span className="nx-listing-media-cover">Ảnh bìa</span>}<button className="nx-listing-remove-image" type="button" aria-label={`Xóa ảnh ${slot.label}`} onClick={() => hub.removeMedia(slot.id)}><i className="bi bi-trash" aria-hidden="true" /></button></figure>)}
    {hub.media.length < 9 && <button type="button" className="nx-listing-media-add" onClick={() => input.current?.click()}><i className="bi bi-images" aria-hidden="true" /><strong>Thêm ảnh</strong><span>Tối đa 9 ảnh</span></button>}
  </div></div>;
}
