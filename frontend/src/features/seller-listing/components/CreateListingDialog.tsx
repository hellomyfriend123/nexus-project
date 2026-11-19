import { useMemo, useRef, useState } from 'react';
import Modal from '../../../shared/components/Modal/Modal';
import ListingSection from '../components/ListingSection';
import ListingBasicInfo from '../components/ListingBasicInfo';
import ListingMedia from '../components/ListingMedia';
import ListingPricing from '../components/ListingPricing';
import ListingDescriptionEditor from '../components/ListingDescriptionEditor';
import { useCreateListing } from '../hooks/useCreateListing';
import '../styles/create-listing.css';

export interface CreateListingDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after the product, images, SKU and stock are all persisted. */
  onSaved: () => void;
}

/** Snapshot of every field the user can change, used to detect unsaved work. */
function draftFingerprint(hub: ReturnType<typeof useCreateListing>): string {
  return JSON.stringify({
    ...hub.draft,
    category: hub.category,
    media: hub.media.map(slot => slot.id),
  });
}

export default function CreateListingDialog({ open, onClose, onSaved }: CreateListingDialogProps) {
  const hub = useCreateListing({ onSuccess: onSaved });
  const initial = useRef<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const current = draftFingerprint(hub);
  const dirty = useMemo(() => initial.current !== null && initial.current !== current, [current]);
  if (initial.current === null) initial.current = current;

  // A partially finished submit may already have created the product server-side; closing now
  // would drop the in-memory retry guard and a later attempt would create a second product.
  const risky = hub.submitting;

  function requestClose() {
    if (risky) return;
    if (dirty && !confirmingDiscard) { setConfirmingDiscard(true); return; }
    setConfirmingDiscard(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={requestClose}
      title="Thêm sản phẩm"
      size="lg"
      busy={risky}
      closeLabel="Đóng thêm sản phẩm"
      className="nx-listing-dialog"
      footer={
        <>
          {confirmingDiscard && (
            <p className="nx-listing-discard" role="alert">
              Bạn có thay đổi chưa lưu.{' '}
              <button type="button" className="nx-listing-discard-confirm" onClick={() => { setConfirmingDiscard(false); onClose(); }}>
                Bỏ thay đổi
              </button>
              <button type="button" className="nx-listing-discard-cancel" onClick={() => setConfirmingDiscard(false)}>
                Tiếp tục nhập
              </button>
            </p>
          )}
          <button type="button" className="nx-listing-btn" disabled={hub.submitting} onClick={requestClose}>Hủy</button>          <button type="submit" form="nx-listing-form" className="nx-listing-btn nx-listing-btn--primary" disabled={hub.submitting}>
            {hub.submitting ? 'Đang lưu sản phẩm…' : 'Lưu sản phẩm'}
          </button>
        </>
      }
    >
      <form id="nx-listing-form" onSubmit={event => { event.preventDefault(); void hub.submitListing(); }} noValidate>
        {hub.errors.length > 0 && <div role="alert" className="nx-listing-guide"><ul>{hub.errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
        <fieldset disabled={hub.submitting} className="nx-seller-form-fields">
          <ListingSection step={1} title="Thông tin sản phẩm" caption="Tên, danh mục và mã quản lý sản phẩm.">
            <ListingBasicInfo hub={hub} />
            <div className="nx-listing-description">
              <label className="nx-listing-label" htmlFor="listing-description">Mô tả sản phẩm <em>*</em></label>
              <ListingDescriptionEditor id="listing-description" disabled={hub.submitting} value={hub.draft.description} onChange={value => hub.updateDraft('description', value)} placeholder="Mô tả đặc điểm, tình trạng và phụ kiện đi kèm…" />
            </div>
          </ListingSection>
          <ListingSection step={2} title={`Hình ảnh (${hub.media.length}/9)`} caption="Ảnh đầu tiên được dùng làm ảnh bìa.">
            <ListingMedia hub={hub} />
          </ListingSection>
          <ListingSection step={3} title="Giá & tồn kho" caption="Giá bán cố định và số lượng có thể đặt mua.">
            <ListingPricing hub={hub} />
          </ListingSection>
        </fieldset>
      </form>
    </Modal>
  );
}
