function ProductPagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav className="nx-results-pagination" aria-label="Phân trang sản phẩm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Trang trước
      </button>
      <span aria-live="polite">
        Trang {page} / {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Trang sau →
      </button>
    </nav>
  );
}

export default ProductPagination;
