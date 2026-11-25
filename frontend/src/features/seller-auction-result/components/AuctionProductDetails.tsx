import type { AuctionAction, AuctionResult } from '../types/auctionResult';

interface Props {
  result: AuctionResult;
  checked: boolean;
  onCheck: (checked: boolean) => void;
  onAction: (action: AuctionAction) => void;
}

export default function AuctionProductDetails({ result, checked, onCheck, onAction }: Props) {
  const { product } = result;
  return (
    <section className="nx-ar-card">
      <div className="nx-ar-card-heading">
        <h2>
          <i className="bi bi-box-seam" aria-hidden="true" /> Sản phẩm đấu giá</h2>
        <span>SKU: {product.sku}</span>
      </div>
      <div className="nx-ar-product">
        {product.image ? <img src={product.image} alt={product.name} /> : <div className="nx-ar-product-image">Chưa có ảnh</div>}
        <div>
          <span className="nx-ar-product-category">{product.category}</span>
          <h3>{product.name}</h3>
          <p>{product.condition}</p>
          <span className="nx-ar-product-quantity">{product.quantity}</span>
          <div className="nx-ar-product-price">
            <span>Giá trúng đấu giá</span>
            <strong>{result.winningBid}</strong>
          </div>
        </div>
      </div>
      <div className="nx-ar-pack-note">
        <i className="bi bi-info-circle" aria-hidden="true" />
        <p>{result.packingNotice}</p>
      </div>
      <label className="nx-ar-checkbox">
        <input type="checkbox" disabled checked={checked} onChange={e => onCheck(e.target.checked)} />
          <span>Tôi đã kiểm tra sản phẩm và sẵn sàng đóng gói giao hàng</span>
        </label>
        <div className="nx-ar-ship-footer">
          <div>
            <i className="bi bi-clock" aria-hidden="true" /> Giao hàng trước
            <strong>{result.deadline}</strong>
          </div>
          <button title="Chưa có API hỗ trợ thao tác này" disabled className="nx-ar-btn nx-ar-btn-primary"  onClick={() => onAction('shipping')}>
            <i className="bi bi-truck" aria-hidden="true" /> Xác nhận & giao hàng</button>
        </div>
      </section>
  );
    }
