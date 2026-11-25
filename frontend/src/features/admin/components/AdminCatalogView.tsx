import { AdminCatalogCategoryModal } from './AdminCatalogCategoryModal';
import { AdminCatalogProductsPanel } from './AdminCatalogProductsPanel';
import { AdminCatalogCategoriesPanel } from './AdminCatalogCategoriesPanel';
import { AdminCatalogTabs } from './AdminCatalogTabs';
import { AdminCatalogHeader } from './AdminCatalogHeader';
import type { useAdminCatalog } from '../hooks/useAdminCatalog';

export function AdminCatalogView(model: ReturnType<typeof useAdminCatalog>) {
  const { error } = model;
  return (
    <div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <AdminCatalogHeader {...model} />

      {/* Tabs */}
      <AdminCatalogTabs {...model} />

      {/* TAB 1: CATEGORIES */}
      <AdminCatalogCategoriesPanel {...model} />

      {/* TAB 2: PRODUCTS */}
      <AdminCatalogProductsPanel {...model} />

      {/* Category Create/Edit Modal */}
      <AdminCatalogCategoryModal {...model} />
    </div>
  );
}
