import type { Metadata } from 'next';
import { CategoriesView } from '@/components/admin/categories/CategoriesView';
import { requireAdmin } from '@/lib/admin/auth';
import { getAdminCatalog } from '@/lib/admin/catalog';

export const metadata: Metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  await requireAdmin();
  const { categories } = await getAdminCatalog();
  return <CategoriesView categories={categories} />;
}
