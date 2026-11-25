import { useEffect, useState } from 'react';
import { flattenCategories, getCatalogCategories, type CatalogCategory } from '../../../services/api/catalog';
import { apiErrorMessage } from '../../../services/api/client';
import { notify } from '../../../shared/components/Toast';
export function useCategories() {
 const [categories, setCategories] = useState<CatalogCategory[]>([]);
 useEffect(() => { const controller = new AbortController();
 getCatalogCategories(controller.signal).then(tree => setCategories(flattenCategories(tree))).catch(error => { if (!controller.signal.aborted) notify.error(apiErrorMessage(error)); });
 return () => controller.abort(); }, []); return categories;
}
