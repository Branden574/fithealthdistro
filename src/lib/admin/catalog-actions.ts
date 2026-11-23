'use server';

import { randomBytes } from 'node:crypto';
import { refresh, updateTag } from 'next/cache';
import { CATALOG_TAG, productImageUrl } from '@/lib/catalog';
import { adminClient } from './auth';
import { readCategoryForm, type CategoryFormState } from './category-form';
import type { QuickResult } from './results';
import { isPhotoPathFor, PHOTO_MAX_BYTES, photoEnding, readProductForm, UUID, type ProductFormState } from './product-form';

const BUCKET = 'product-photos';

type DbError = { code?: string; message?: string } | null;

/** The storefront reads the catalog from a cache; a change here expires it, and the admin page shows the change at once. */
function catalogChanged() {
  updateTag(CATALOG_TAG);
  refresh();
}

function log(where: string, error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'unknown error';
  console.error(`${where} failed: ${message}`);
}

/** Adds or saves a product from the dialog. Everything is checked again here and once more by the database. */
export async function saveProduct(previous: ProductFormState, form: FormData): Promise<ProductFormState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const read = readProductForm(form);
  if (!read.ok) return { status: 'invalid', errors: read.errors, specErrors: read.specErrors, attempt };
  const input = read.input;

  try {
    const context = await adminClient();
    if (!context) return { status: 'signed-out', attempt };
    const { supabase } = context;

    const row = {
      name: input.name,
      category_id: input.categoryId,
      price_cents: input.priceCents,
      price_note: input.priceNote,
      sku: input.sku,
      description: input.description,
      stock_status: input.stock,
      visible: input.visible,
      image_path: input.imagePath,
      details: input.details,
      specs: input.specs.map((spec) => ({ label: spec.label, value: spec.value })),
      // Saved from the form, it has been looked over: it is no longer a sample.
      is_sample: false,
    };

    let oldImage: string | null = null;
    let error: DbError = null;
    if (input.isNew) {
      // An empty address is filled from the name by the database.
      ({ error } = await supabase.from('products').insert({ id: input.id, ...row, slug: input.slug }));
    } else {
      const { data: before, error: readError } = await supabase.from('products').select('image_path').eq('id', input.id).maybeSingle();
      if (readError) throw readError;
      if (!before) return { status: 'missing', attempt };
      oldImage = before.image_path;
      const result = await supabase.from('products').update({ ...row, slug: input.slug }).eq('id', input.id).select('id');
      error = result.error;
      if (!error && !result.data?.length) return { status: 'missing', attempt };
    }

    if (error) {
      const text = error.message ?? '';
      if (error.code === '23505' && text.includes('products_sku_key')) return { status: 'invalid', errors: { sku: 'Another product uses this SKU.' }, attempt };
      if (error.code === '23505' && text.includes('products_slug')) return { status: 'invalid', errors: { slug: 'Another product uses this address.' }, attempt };
      if (error.code === '23505' && text.includes('products_pkey')) return { status: 'error', attempt };
      if (error.code === '23503') return { status: 'invalid', errors: { categoryId: 'That category is gone. Choose another.' }, attempt };
      if (error.code === '42501') return { status: 'signed-out', attempt };
      throw error;
    }

    // The photo it replaced is no longer used anywhere.
    if (oldImage && oldImage !== input.imagePath) await removePhotos(supabase, [oldImage]);

    catalogChanged();
    return { status: 'saved', name: input.name, visible: input.visible, isNew: input.isNew, imagePath: input.imagePath, attempt };
  } catch (error) {
    log('saveProduct', error);
    return { status: 'error', attempt };
  }
}

/** The In catalog switch: shows or hides a product at once, keeping everything about it. */
export async function setProductVisible(id: string, visible: boolean): Promise<QuickResult> {
  if (typeof id !== 'string' || !UUID.test(id) || typeof visible !== 'boolean') return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data, error } = await context.supabase.from('products').update({ visible }).eq('id', id).select('id');
    if (error) throw error;
    if (!data.length) return { ok: false, reason: 'missing' };
    catalogChanged();
    return { ok: true };
  } catch (error) {
    log('setProductVisible', error);
    return { ok: false, reason: 'error' };
  }
}

/** Removes a product for good, with its photos. Inquiries that mention it keep its name and SKU. */
export async function removeProduct(id: string): Promise<QuickResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { supabase } = context;
    const { data, error } = await supabase.from('products').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data.length) return { ok: false, reason: 'missing' };
    const { data: files } = await supabase.storage.from(BUCKET).list(id, { limit: 100 });
    if (files?.length) await removePhotos(supabase, files.map((file) => `${id}/${file.name}`));
    catalogChanged();
    return { ok: true };
  } catch (error) {
    log('removeProduct', error);
    return { ok: false, reason: 'error' };
  }
}

export type UploadTicket =
  | { ok: true; path: string; url: string; publicUrl: string }
  | { ok: false; reason: 'signed-out' | 'type' | 'error' };

/**
 * Lets the browser upload one photo straight to storage, into the product's own folder, under a new name. The upload
 * link works once, for two hours. The bucket itself refuses other types and anything over 5 MB.
 */
export async function startPhotoUpload(productId: string, type: string, size: number): Promise<UploadTicket> {
  const ending = photoEnding(type);
  if (typeof productId !== 'string' || !UUID.test(productId)) return { ok: false, reason: 'error' };
  if (!ending || typeof size !== 'number' || !(size > 0 && size <= PHOTO_MAX_BYTES)) return { ok: false, reason: 'type' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const path = `${productId}/${randomBytes(8).toString('hex')}.${ending}`;
    const { data, error } = await context.supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    return { ok: true, path, url: data.signedUrl, publicUrl: productImageUrl(path) };
  } catch (error) {
    log('startPhotoUpload', error);
    return { ok: false, reason: 'error' };
  }
}

/** Tidies away photos uploaded in a dialog that was then closed, or replaced before saving. Never one a product uses. */
export async function discardPhotos(productId: string, paths: string[]): Promise<void> {
  if (typeof productId !== 'string' || !UUID.test(productId) || !Array.isArray(paths)) return;
  const own = paths.slice(0, 20).filter((path) => typeof path === 'string' && isPhotoPathFor(productId, path));
  if (!own.length) return;
  try {
    const context = await adminClient();
    if (!context) return;
    const { data, error } = await context.supabase.from('products').select('image_path').in('image_path', own);
    if (error) throw error;
    const used = new Set(data.map((row) => row.image_path));
    await removePhotos(
      context.supabase,
      own.filter((path) => !used.has(path)),
    );
  } catch (error) {
    log('discardPhotos', error);
  }
}

async function removePhotos(supabase: NonNullable<Awaited<ReturnType<typeof adminClient>>>['supabase'], paths: string[]) {
  if (!paths.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  // A photo left behind costs a little storage and nothing else; never fail a save over it.
  if (error) log('removePhotos', error);
}

/** Adds a category, or renames one and changes its icon. Its address never changes, so filtered links keep working. */
export async function saveCategory(previous: CategoryFormState, form: FormData): Promise<CategoryFormState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const read = readCategoryForm(form);
  if (!read.ok) return { status: 'invalid', errors: read.errors, attempt };
  const { id, name, icon } = read.input;
  try {
    const context = await adminClient();
    if (!context) return { status: 'signed-out', attempt };
    const { supabase } = context;

    // Two categories with the same name would be two identical chips on the storefront. The list is short; compare here.
    const { data: all, error: listError } = await supabase.from('categories').select('id, name');
    if (listError) throw listError;
    const key = name.toLocaleLowerCase('en-US');
    if (all.some((row) => row.id !== id && row.name.toLocaleLowerCase('en-US') === key))
      return { status: 'invalid', errors: { name: 'Another category has this name.' }, attempt };

    if (id) {
      const { data, error } = await supabase.from('categories').update({ name, icon }).eq('id', id).select('id');
      if (error) throw error;
      if (!data.length) return { status: 'missing', attempt };
    } else {
      const { error } = await supabase.from('categories').insert({ name, icon, slug: '' });
      if (error) throw error;
    }
    catalogChanged();
    return { status: 'saved', name, isNew: !id, attempt };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '42501') return { status: 'signed-out', attempt };
    log('saveCategory', error);
    return { status: 'error', attempt };
  }
}
