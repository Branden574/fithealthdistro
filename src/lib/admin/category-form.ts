/** The category form: its limits and icons, how it is read, and how it is checked. Shared by the dialog and the action. */

export const CATEGORY_ICONS = ['lockers', 'jar-label', 'drop', 'package', 'barbell', 'pill'] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_ICON_LABELS: Readonly<Record<CategoryIcon, string>> = {
  lockers: 'Vending machine',
  'jar-label': 'Supplement jar',
  drop: 'Drink',
  package: 'Box',
  barbell: 'Barbell',
  pill: 'Pill',
};

export const CATEGORY_NAME_MAX = 40;

export interface CategoryInput {
  /** Empty for a new category. */
  id: string;
  name: string;
  icon: CategoryIcon;
}

export interface CategoryFormState {
  status: 'idle' | 'invalid' | 'saved' | 'signed-out' | 'missing' | 'error';
  errors?: { name?: string; icon?: string };
  name?: string;
  isNew?: boolean;
  attempt: number;
}

export const INITIAL_CATEGORY_STATE: CategoryFormState = { status: 'idle', attempt: 0 };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CONTROL = new RegExp(`[${String.fromCodePoint(0)}-${String.fromCodePoint(31)}${String.fromCodePoint(127)}]`, 'g');

export function isCategoryIcon(value: unknown): value is CategoryIcon {
  return typeof value === 'string' && (CATEGORY_ICONS as readonly string[]).includes(value);
}

export function readCategoryForm(form: FormData): { ok: true; input: CategoryInput } | { ok: false; errors: NonNullable<CategoryFormState['errors']> } {
  const rawId = form.get('id');
  const id = typeof rawId === 'string' && UUID.test(rawId) ? rawId : '';
  const rawName = form.get('name');
  const name = typeof rawName === 'string' ? rawName.slice(0, 400).replace(CONTROL, ' ').replace(/\s+/g, ' ').trim() : '';
  const icon = form.get('icon');

  const errors: NonNullable<CategoryFormState['errors']> = {};
  if (!name) errors.name = 'Give the category a name.';
  else if (name.length > CATEGORY_NAME_MAX) errors.name = `Keep the name to ${CATEGORY_NAME_MAX} characters.`;
  if (!isCategoryIcon(icon)) errors.icon = 'Choose an icon.';
  if (errors.name || errors.icon || !isCategoryIcon(icon)) return { ok: false, errors };
  return { ok: true, input: { id, name, icon } };
}
