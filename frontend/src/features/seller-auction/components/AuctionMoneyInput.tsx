import type { CreateAuctionState } from '../hooks/useCreateAuction';
export default function AuctionMoneyInput({ hub, label }: { hub: CreateAuctionState; field: 'startingPrice'; label: string }) {
  return <label className="sca-field"><span>{label}</span><div className="sca-money">
    <input aria-label={label} inputMode="numeric" disabled={hub.busy || !!hub.created} value={hub.draft.startingPrice ? Number(hub.draft.startingPrice).toLocaleString('vi-VN') : ''} onChange={event => hub.update('startingPrice', event.target.value.replace(/\D/g, ''))} /><b>VNĐ</b>
  </div></label>;
}
