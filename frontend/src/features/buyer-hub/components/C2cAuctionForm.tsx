import type { C2cDraft, C2cOption } from '../types/buyerHub';

interface C2cAuctionFormProps {
  title: string;
  draft: C2cDraft;
  categories: C2cOption[];
  durations: C2cOption[];
  onChange: <K extends keyof C2cDraft>(field: K, value: C2cDraft[K]) => void;
  onReset: () => void;
  onSubmit: () => void;
}

/** Inline "create a C2C auction" form. Mock only — nothing is submitted to a server. */
export default function C2cAuctionForm({
  title,
  draft,
  categories,
  durations,
  onChange,
  onReset,
  onSubmit,
}: C2cAuctionFormProps) {
  return (
    <div className="nx-hub-c2c-form-card">
      <div className="nx-hub-c2c-form-head">
        <i className="bi bi-plus-circle" aria-hidden="true"></i>
        <h4 className="nx-hub-c2c-form-title">{title}</h4>
      </div>

      <form
        className="nx-hub-c2c-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="nx-hub-field nx-hub-field--full">
          <label className="nx-hub-field-label" htmlFor="c2c-name">
            Tên sản phẩm đấu giá
          </label>
          <input
            id="c2c-name"
            type="text"
            className="nx-hub-input"
            placeholder="VD: Thẻ bài Pokemon Charizard 1st Edition PSA 9"
            value={draft.name}
            onChange={(event) => onChange('name', event.target.value)}
          />
        </div>

        <div className="nx-hub-field">
          <label className="nx-hub-field-label" htmlFor="c2c-category">
            Danh mục
          </label>
          <select
            id="c2c-category"
            className="nx-hub-select"
            value={draft.category}
            onChange={(event) => onChange('category', event.target.value)}
          >
            {categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="nx-hub-field">
          <label className="nx-hub-field-label" htmlFor="c2c-duration">
            Thời gian đấu giá
          </label>
          <select
            id="c2c-duration"
            className="nx-hub-select"
            value={draft.duration}
            onChange={(event) => onChange('duration', event.target.value)}
          >
            {durations.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="nx-hub-field">
          <label className="nx-hub-field-label" htmlFor="c2c-start-price">
            Giá khởi điểm (VNĐ)
          </label>
          <input
            id="c2c-start-price"
            type="text"
            className="nx-hub-input"
            placeholder="1.000.000"
            value={draft.startPrice}
            onChange={(event) => onChange('startPrice', event.target.value)}
          />
        </div>

        <div className="nx-hub-field">
          <label className="nx-hub-field-label" htmlFor="c2c-step-price">
            Bước giá tối thiểu (VNĐ)
          </label>
          <input
            id="c2c-step-price"
            type="text"
            className="nx-hub-input"
            placeholder="50.000"
            value={draft.stepPrice}
            onChange={(event) => onChange('stepPrice', event.target.value)}
          />
        </div>

        <div className="nx-hub-c2c-escrow nx-hub-field--full">
          <input
            id="c2c-escrow-check"
            type="checkbox"
            className="nx-hub-checkbox"
            checked={draft.escrow}
            onChange={(event) => onChange('escrow', event.target.checked)}
          />
          <label className="nx-hub-c2c-escrow-label" htmlFor="c2c-escrow-check">
            Kích hoạt <strong>Nexus Buyer Escrow Protection</strong> (Tiền thắng đấu giá sẽ được giữ
            ký quỹ trung gian cho đến khi người mua nhận đúng mô tả).
          </label>
        </div>

        <div className="nx-hub-c2c-form-actions">
          <button type="button" className="nx-hub-btn nx-hub-btn--cancel" onClick={onReset}>
            Hủy bỏ
          </button>
          <button type="submit" className="nx-hub-btn nx-hub-btn--danger">
            Khởi động phiên đấu giá
          </button>
        </div>
      </form>
    </div>
  );
}
