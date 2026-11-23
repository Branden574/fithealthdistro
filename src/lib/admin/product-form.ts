/**
 * The product form: its limits, how it is read from a submitted form and how it is checked. Shared by the dialog (for
 * counters and limits) and the server action, which checks everything again. The database enforces the same rules.
 */

export const PRODUCT_LIMITS = {
  name: 120,
  sku: 40,
  description: 600,
  priceNote: 40,
  details: 4000,
  slug: 80,
  specLabel: 40,
  specValue: 200,
  specRows: 30,
  /** Photos a product can have; the first is the cover. */
  photos: 8,
} as const;

/** Largest price the catalog takes, in cents: $1,000,000. */
export const MAX_PRICE_CENTS = 100_000_000;

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export const STOCK_OPTIONS: ReadonlyArray<{ value: StockStatus; label: string; tone: 'success' | 'warning' | 'danger' }> = [
  { value: 'in_stock', label: 'In stock', tone: 'success' },
  { value: 'low_stock', label: 'Low stock', tone: 'warning' },
  { value: 'out_of_stock', label: 'Out of stock', tone: 'danger' },
];

/** Photo types the bucket accepts, and the file ending each is saved with. */
const PHOTO_TYPES = new Map<string, 'jpg' | 'png' | 'webp'>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

/** The file ending for an accepted photo type, or undefined for anything else. */
export function photoEnding(type: unknown): 'jpg' | 'png' | 'webp' | undefined {
  return typeof type === 'string' ? PHOTO_TYPES.get(type) : undefined;
}
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export interface SpecRow {
  label: string;
  value: string;
}

export type ProductField =
  | 'name'
  | 'categoryId'
  | 'price'
  | 'priceNote'
  | 'sku'
  | 'description'
  | 'stock'
  | 'photo'
  | 'details'
  | 'specs'
  | 'slug';

export interface ProductInput {
  id: string;
  isNew: boolean;
  name: string;
  categoryId: string;
  priceCents: number | null;
  priceNote: string;
  sku: string;
  description: string;
  stock: StockStatus;
  visible: boolean;
  /** Paths in the product's own photo folder, in display order. The first is the cover. */
  photos: string[];
  details: string;
  specs: SpecRow[];
  /** Empty on a new product: the database makes one from the name. */
  slug: string;
}

export interface ProductFormState {
  status: 'idle' | 'invalid' | 'saved' | 'signed-out' | 'missing' | 'error';
  errors?: Partial<Record<ProductField, string>>;
  /** Per spec row, in the order the rows were sent. */
  specErrors?: Array<{ label?: string; value?: string } | null>;
  /** The saved product's name, for the confirmation. */
  name?: string;
  visible?: boolean;
  isNew?: boolean;
  /** The photos the saved product kept, so the dialog can tidy away others it uploaded. */
  photos?: string[];
  attempt: number;
}

export const INITIAL_PRODUCT_STATE: ProductFormState = { status: 'idle', attempt: 0 };

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SKU = /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PRICE = /^\d{1,7}(\.\d{1,2})?$/;
// Control characters: nothing a person types into a one-line field. Built from code points so the source stays readable.
const CONTROL = new RegExp(`[${String.fromCodePoint(0)}-${String.fromCodePoint(31)}${String.fromCodePoint(127)}]`, 'g');
const CONTROL_KEEP_LINES = new RegExp(`[${String.fromCodePoint(0)}-${String.fromCodePoint(9)}${String.fromCodePoint(11)}-${String.fromCodePoint(31)}${String.fromCodePoint(127)}]`, 'g');

/** Is this a path in the product's own photo folder, as the upload makes them? */
export function isPhotoPathFor(productId: string, path: string): boolean {
  return path.length <= 120 && new RegExp(`^${productId}/[0-9a-z-]{1,64}\\.(jpg|png|webp)$`).test(path);
}

/** "4250", "4,250.5", "$39.99" to cents. Null for an empty field; undefined for something that is not a price. */
export function parsePrice(raw: string): number | null | undefined {
  const text = raw.replace(/[$,\s]/g, '');
  if (!text) return null;
  if (!PRICE.test(text)) return undefined;
  const [whole, part = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number(part.padEnd(2, '0'));
  return cents <= MAX_PRICE_CENTS ? cents : undefined;
}

/** Cents back to what the price field shows: 425000 to "4250.00". */
export function priceText(cents: number | null): string {
  return cents == null ? '' : (cents / 100).toFixed(2);
}

/** Reads a form value, bounded first so nothing later works on an oversized string. */
function text(form: FormData, name: string, limit: number): { value: string; long: boolean } {
  const raw = form.get(name);
  if (typeof raw !== 'string') return { value: '', long: false };
  return { value: raw.slice(0, limit * 4 + 8), long: raw.length > limit * 4 + 8 };
}

const oneLine = (value: string) => value.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
const multiLine = (value: string) => value.replace(/\r\n?/g, '\n').replace(CONTROL_KEEP_LINES, '').trim();

export type ReadResult =
  | { ok: true; input: ProductInput }
  | { ok: false; errors: Partial<Record<ProductField, string>>; specErrors: ProductFormState['specErrors'] };

/** Reads and checks a submitted product form. */
export function readProductForm(form: FormData): ReadResult {
  const errors: Partial<Record<ProductField, string>> = {};
  const id = text(form, 'id', 36).value;
  const isNew = form.get('is_new') === 'yes';

  const name = oneLine(text(form, 'name', PRODUCT_LIMITS.name).value);
  if (!name) errors.name = 'Give the product a name.';
  else if (name.length > PRODUCT_LIMITS.name) errors.name = `Keep the name to ${PRODUCT_LIMITS.name} characters.`;

  const categoryId = text(form, 'category_id', 36).value;
  if (!UUID.test(categoryId)) errors.categoryId = 'Choose a category.';

  const priceRaw = text(form, 'price', 16).value;
  const priceCents = parsePrice(priceRaw);
  if (priceCents === undefined) errors.price = 'Write the price as a number, such as 4250 or 39.99, up to 1,000,000.';

  const priceNote = oneLine(text(form, 'price_note', PRODUCT_LIMITS.priceNote).value);
  if (priceNote.length > PRODUCT_LIMITS.priceNote) errors.priceNote = `Keep the note to ${PRODUCT_LIMITS.priceNote} characters.`;

  const sku = text(form, 'sku', PRODUCT_LIMITS.sku).value.trim();
  if (!sku) errors.sku = 'Give the product a SKU.';
  else if (!SKU.test(sku)) errors.sku = 'Use up to 40 letters, digits, dots, dashes or underscores, starting with a letter or digit.';

  const description = multiLine(text(form, 'description', PRODUCT_LIMITS.description).value);
  if (description.length > PRODUCT_LIMITS.description) errors.description = `Keep the description to ${PRODUCT_LIMITS.description} characters.`;

  const stockRaw = form.get('stock');
  const stock = STOCK_OPTIONS.find((option) => option.value === stockRaw)?.value;
  if (!stock) errors.stock = 'Choose how much is in stock.';

  // Photo paths arrive in display order, one field each. Only paths in this product's own folder, once each.
  const photoValues = form.getAll('photos').slice(0, PRODUCT_LIMITS.photos + 1);
  const photos = [...new Set(photoValues.map((value) => (typeof value === 'string' ? value.slice(0, 130) : '')))];
  if (photoValues.length > PRODUCT_LIMITS.photos) errors.photo = `Keep it to ${PRODUCT_LIMITS.photos} photos.`;
  else if (photos.length !== photoValues.length || photos.some((path) => !(UUID.test(id) && isPhotoPathFor(id, path))))
    errors.photo = 'Choose the photos again.';


  const details = multiLine(text(form, 'details', PRODUCT_LIMITS.details).value);
  if (details.length > PRODUCT_LIMITS.details) errors.details = `Keep the page text to ${PRODUCT_LIMITS.details.toLocaleString('en-US')} characters.`;

  const slug = text(form, 'slug', PRODUCT_LIMITS.slug).value.trim().toLowerCase();
  if (!slug && !isNew) errors.slug = 'Give the page an address.';
  else if (slug && (!SLUG.test(slug) || slug.length > PRODUCT_LIMITS.slug))
    errors.slug = 'Use lowercase letters and digits, with single dashes between words.';

  // Spec rows arrive as matching lists. A row left wholly empty is dropped.
  const labels = form.getAll('spec_label').slice(0, PRODUCT_LIMITS.specRows + 1);
  const values = form.getAll('spec_value').slice(0, PRODUCT_LIMITS.specRows + 1);
  const specs: SpecRow[] = [];
  const specErrors: NonNullable<ProductFormState['specErrors']> = [];
  let specProblem = false;
  for (let index = 0; index < Math.max(labels.length, values.length); index++) {
    const label = oneLine(typeof labels[index] === 'string' ? (labels[index] as string).slice(0, 200) : '');
    const value = oneLine(typeof values[index] === 'string' ? (values[index] as string).slice(0, 1000) : '');
    if (!label && !value) {
      specErrors.push(null);
      continue;
    }
    const rowError: { label?: string; value?: string } = {};
    if (!label) rowError.label = 'Add a label, or clear the value.';
    else if (label.length > PRODUCT_LIMITS.specLabel) rowError.label = `Keep it to ${PRODUCT_LIMITS.specLabel} characters.`;
    if (!value) rowError.value = 'Add a value, or clear the label.';
    else if (value.length > PRODUCT_LIMITS.specValue) rowError.value = `Keep it to ${PRODUCT_LIMITS.specValue} characters.`;
    if (rowError.label || rowError.value) specProblem = true;
    specErrors.push(rowError.label || rowError.value ? rowError : null);
    specs.push({ label, value });
  }
  if (specs.length > PRODUCT_LIMITS.specRows) errors.specs = `Keep it to ${PRODUCT_LIMITS.specRows} rows.`;
  else if (specProblem) errors.specs = 'Finish or clear the rows marked below.';

  if (!UUID.test(id)) errors.name ??= 'Close this form and open it again.';

  if (Object.keys(errors).length || !stock || priceCents === undefined) return { ok: false, errors, specErrors };
  return {
    ok: true,
    input: {
      id,
      isNew,
      name,
      categoryId,
      priceCents,
      priceNote,
      sku,
      description,
      stock,
      visible: form.get('visible') === 'yes',
      photos,
      details,
      specs,
      slug,
    },
  };
}
