import 'server-only';
import { productImageUrl } from '@/lib/catalog';
import { createSessionClient } from '@/lib/supabase/server';
import { isCategoryIcon, type CategoryIcon } from './category-form';
import type { SpecRow, StockStatus } from './product-form';

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  icon: CategoryIcon;
  position: number;
  productCount: number;
  visibleCount: number;
}

export interface AdminProduct {
  id: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  name: string;
  sku: string;
  description: string;
  priceCents: number | null;
  priceNote: string;
  stock: StockStatus;
  visible: boolean;
  imagePath: string | null;
  imageUrl: string | null;
  isSample: boolean;
  details: string;
  specs: SpecRow[];
}

function specRows(value: unknown): SpecRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) =>
    row && typeof row === 'object' && typeof row.label === 'string' && typeof row.value === 'string' ? [{ label: row.label, value: row.value }] : [],
  );
}

const asIcon = (icon: string): CategoryIcon => (isCategoryIcon(icon) ? icon : 'package');

/**
 * Everything in the catalog, hidden products included, read as the signed-in admin. Never cached: it is read per request
 * with the admin's own session, and the database returns nothing to anyone else. Call `requireAdmin` first.
 */
export async function getAdminCatalog(): Promise<{ categories: AdminCategory[]; products: AdminProduct[] }> {
  const supabase = await createSessionClient();
  const [categories, products] = await Promise.all([
    supabase.from('categories').select('id, slug, name, icon, position').order('position').order('name'),
    supabase
      .from('products')
      .select('id, slug, category_id, name, sku, description, price_cents, price_note, stock_status, visible, image_path, is_sample, details, specs')
      .order('name'),
  ]);
  if (categories.error) throw new Error(`Could not read categories: ${categories.error.message}`);
  if (products.error) throw new Error(`Could not read products: ${products.error.message}`);

  const names = new Map(categories.data.map((row) => [row.id, row.name]));
  const list: AdminProduct[] = products.data.map((row) => ({
    id: row.id,
    slug: row.slug,
    categoryId: row.category_id,
    categoryName: names.get(row.category_id) ?? '',
    name: row.name,
    sku: row.sku,
    description: row.description,
    priceCents: row.price_cents,
    priceNote: row.price_note,
    stock: row.stock_status,
    visible: row.visible,
    imagePath: row.image_path,
    imageUrl: row.image_path ? productImageUrl(row.image_path) : null,
    isSample: row.is_sample,
    details: row.details,
    specs: specRows(row.specs),
  }));

  return {
    categories: categories.data.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      icon: asIcon(row.icon),
      position: row.position,
      productCount: list.filter((product) => product.categoryId === row.id).length,
      visibleCount: list.filter((product) => product.categoryId === row.id && product.visible).length,
    })),
    products: list,
  };
}
