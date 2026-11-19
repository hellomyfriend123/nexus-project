import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../../../shared/components/Modal/Modal';
import AuctionProductSection from '../components/AuctionProductSection';
import AuctionPricingSection from '../components/AuctionPricingSection';
import AuctionScheduleSection from '../components/AuctionScheduleSection';
import AuctionFeedback from '../components/AuctionFeedback';
import { useCreateAuction } from '../hooks/useCreateAuction';
import type { Auction } from '../../../services/api/seller';
import '../styles/create-auction.css';

export interface CreateAuctionDialogProps {
  open: boolean;
  onClose: () => void;
  /** Preselected product when opened from an inventory row. */
  productId?: string | null;
  onCreated: (auction: Auction) => void;
}

export default function CreateAuctionDialog({ open, onClose, productId, onCreated }: CreateAuctionDialogProps) {
  const hub = useCreateAuction({ initialProductId: productId ?? null, onSuccess: onCreated });
  const initial = useRef<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const current = useMemo(() => JSON.stringify(hub.draft), [hub.draft]);
  const dirty = initial.current !== null && initial.current !== current;
  if (initial.current === null) initial.current = current;

  // `uncertain` means the POST may have landed server-side: closing would hide that fact and
  // invite a duplicate auction, so the dialog stays open until the user acknowledges it.
  const risky = hub.busy || hub.uncertain;

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
      title="Tạo phiên đấu giá"
      size="lg"
      busy={risky}
      closeLabel="Đóng tạo phiên đấu giá"
      className="sca-dialog"
      footer={
        <>
          {confirmingDiscard && (
            <p className="sca-discard" role="alert">
              Bạn có thay đổi chưa lưu.{' '}
              <button type="button" className="sca-discard-confirm" onClick={() => { setConfirmingDiscard(false); onClose(); }}>
                Bỏ thay đổi
              </button>
              <button type="button" className="sca-discard-cancel" onClick={() => setConfirmingDiscard(false)}>
                Tiếp tục nhập
              </button>
            </p>
          )}
          <button type="button" className="nx-seller-secondary" disabled={hub.busy} onClick={requestClose}>Hủy</button>
          <button
            type="submit"
            form="sca-form"
            className="nx-seller-primary"
            disabled={hub.uncertain || hub.busy || hub.loading || !!hub.loadError || !hub.product || !!hub.created}
          >
            {hub.busy ? 'Đang tạo phiên…' : hub.created ? 'Đã tạo phiên' : 'Tạo phiên đấu giá'}
          </button>
        </>
      }
    >
      <AuctionFeedback hub={hub} />
      <p className="sca-dialog-links"><Link to="/seller-hub?tab=auctions">Về danh sách phiên</Link></p>
      <form id="sca-form" onSubmit={hub.submit} noValidate>
        <fieldset className="nx-seller-form-fields" disabled={hub.busy || !!hub.created || hub.uncertain}>
          <AuctionProductSection hub={hub} />
          <AuctionPricingSection hub={hub} />
          <AuctionScheduleSection hub={hub} />
        </fieldset>
      </form>
    </Modal>
  );
}
