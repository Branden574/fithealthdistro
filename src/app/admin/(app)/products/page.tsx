import type { Metadata } from 'next';
import { ProductsView } from '@/components/admin/products/ProductsView';
import { requireAdmin } from '@/lib/admin/auth';
import { getAdminCatalog } from '@/lib/admin/catalog';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage() {
  await requireAdmin();
  const { categories, products } = await getAdminCatalog();
  return <ProductsView categories={categories} products={products} />;
}
