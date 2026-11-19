function ProductSort({
  sort,
  setSort,
}: {
  sort: string;
  setSort: (value: string) => void;
}) {
  return (
    <label className="nx-sort">
      Sắp xếp
      <select value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="featured">Mới nhất</option>
        <option value="price-low">Giá thấp đến cao</option>
        <option value="price-high">Giá cao đến thấp</option>
      </select>
    </label>
  );
}

export default ProductSort;
