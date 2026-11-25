import type { FilterChipOption } from '../types/buyerHub';

interface FilterChipsProps<TId extends string> {
  options: FilterChipOption<TId>[];
  activeId: TId;
  onSelect: (id: TId) => void;
  /** "filled" is the auctions palette, "solid" is the orders palette. */
  variant: 'filled' | 'solid';
  ariaLabel: string;
}

export default function FilterChips<TId extends string>({
  options,
  activeId,
  onSelect,
  variant,
  ariaLabel,
}: FilterChipsProps<TId>) {
  return (
    <div className={`nx-hub-chips nx-hub-chips--${variant}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = option.id === activeId;

        return (
          <button
            key={option.id}
            type="button"
            className={`nx-hub-chip${isActive ? ' is-active' : ''}`}
            aria-pressed={isActive}
            onClick={() => onSelect(option.id)}
          >
            {option.label} ({option.count})
          </button>
        );
      })}
    </div>
  );
}
