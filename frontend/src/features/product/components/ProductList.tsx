import type { Product } from '../types/product';
import ProductCard from './ProductCard';
function ProductList({ products }: { products: Product[] }) {
  return (
    <div className="nx-grid nx-category-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductList;
