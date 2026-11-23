import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import { supabaseUrl } from '@/lib/supabase/env';
import { searchable } from './search';

/** Cache tag for categories, visible products and the public contact details. Any product or category change expires it. */
export const CATALOG_TAG = 'catalog';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type CategoryIcon = 'lockers' | 'jar-label' | 'drop' | 'package' | 'barbell' | 'pill';

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
  icon: CategoryIcon;
}

export interface CatalogProduct {
  id: string;
  /** The product page's address: /products/<slug>. */
  slug: string;
  categoryId: string;
  name: string;
  description: string;
  /** Dollars, or null when the product has no listed price. */
  price: number | null;
  priceNote: string;
  stock: StockStatus;
  imageUrl: string | null;
  isSample: boolean;
  /** What the catalog search looks through, prepared on the server: name, description, category, price note, specs and details. */
  search: string;
}

export interface Catalog {
  /** Categories in catalog order (vending machines first), only those with at least one visible product. */
  categories: CatalogCategory[];
  /** Visible products, grouped by category order, then by name. */
  products: CatalogProduct[];
}

export interface PublicSettings {
  email: string;
  phone: string;
}

const ICONS: readonly CategoryIcon[] = ['lockers', 'jar-label', 'drop', 'package', 'barbell', 'pill'];

/** How much of a product's long description the catalog search looks through. */
const SEARCH_DETAILS = 600;

/** The public URL of a product photo in the product-photos bucket. */
export function productImageUrl(path: string): string {
  return `${supabaseUrl()}/storage/v1/object/public/product-photos/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/** What visitors can browse. Read as a visitor (anon), so hidden products never appear; cached until a product changes. */
export async function getCatalog(): Promise<Catalog> {
  'use cache';
  cacheTag(CATALOG_TAG);
  cacheLife('max');
  const db = createPublicClient();
  const [categories, products] = await Promise.all([
    db.from('categories').select('id, slug, name, icon, position').order('position').order('name'),
    db
      .from('products')
      .select('id, slug, category_id, name, description, price_cents, price_note, stock_status, image_path, is_sample, specs, details')
      .order('name'),
  ]);
  if (categories.error) throw new Error(`Could not load categories: ${categories.error.message}`);
  if (products.error) throw new Error(`Could not load products: ${products.error.message}`);

  const order = new Map(categories.data.map((category, index) => [category.id, index]));
  const categoryName = new Map(categories.data.map((category) => [category.id, category.name]));
  const list: CatalogProduct[] = products.data
    .filter((row) => order.has(row.category_id))
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      categoryId: row.category_id,
      name: row.name,
      description: row.description,
      price: row.price_cents == null ? null : row.price_cents / 100,
      priceNote: row.price_note,
      stock: row.stock_status,
      imageUrl: row.image_path ? productImageUrl(row.image_path) : null,
      isSample: row.is_sample,
      search: searchable(
        [
          row.name,
          row.description,
          categoryName.get(row.category_id) ?? '',
          row.price_note,
          ...toSpecs(row.specs).flatMap((spec) => [spec.label, spec.value]),
          // Enough of the long description to find a feature it mentions, without sending all of it to every visitor.
          row.details.slice(0, SEARCH_DETAILS),
        ].join(' '),
      ),
    }))
    .sort((a, b) => (order.get(a.categoryId) ?? 0) - (order.get(b.categoryId) ?? 0));

  const used = new Set(list.map((product) => product.categoryId));
  return {
    categories: categories.data
      .filter((category) => used.has(category.id))
      .map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        icon: (ICONS as readonly string[]).includes(category.icon) ? (category.icon as CategoryIcon) : 'package',
      })),
    products: list,
  };
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductDetail extends CatalogProduct {
  /** The longer description for the product's page. Plain text; blank lines separate paragraphs. */
  details: string;
  specs: ProductSpec[];
  category: CatalogCategory;
}

/** Spec rows as stored, keeping only well-formed ones. The database checks the shape too. */
function toSpecs(raw: unknown): ProductSpec[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) =>
    row && typeof row === 'object' && typeof row.label === 'string' && typeof row.value === 'string'
      ? [{ label: row.label, value: row.value }]
      : [],
  );
}

/** The addresses of every product page visitors can open. */
export async function getProductSlugs(): Promise<string[]> {
  return (await getCatalog()).products.map((product) => product.slug);
}

/** One product's page, read as a visitor: null when there is no such product or it is hidden. Cached with the catalog. */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  'use cache';
  cacheTag(CATALOG_TAG);
  cacheLife('max');
  const catalog = await getCatalog();
  const product = catalog.products.find((item) => item.slug === slug);
  const category = product ? catalog.categories.find((item) => item.id === product.categoryId) : undefined;
  if (!product || !category) return null;
  const { data, error } = await createPublicClient().from('products').select('details, specs').eq('id', product.id).maybeSingle();
  if (error) throw new Error(`Could not load the product: ${error.message}`);
  if (!data) return null;
  return { ...product, details: data.details, specs: toSpecs(data.specs), category };
}

/** The business contact details visitors may see. Empty strings when not set yet. */
export async function getPublicSettings(): Promise<PublicSettings> {
  'use cache';
  cacheTag(CATALOG_TAG);
  cacheLife('max');
  const { data, error } = await createPublicClient().from('business_settings').select('public_email, public_phone').maybeSingle();
  if (error) throw new Error(`Could not load contact details: ${error.message}`);
  return { email: data?.public_email ?? '', phone: data?.public_phone ?? '' };
}
