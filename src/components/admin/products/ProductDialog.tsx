'use client';

import { Alert, Button, Checkbox, Dialog, PhotosField, Select, TextField } from '@ds';
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import type { AdminCategory, AdminProduct } from '@/lib/admin/catalog';
import { discardPhotos, saveProduct, startPhotoUpload } from '@/lib/admin/catalog-actions';
import {
  INITIAL_PRODUCT_STATE,
  PHOTO_MAX_BYTES,
  photoEnding,
  PRODUCT_LIMITS,
  priceText,
  STOCK_OPTIONS,
  type ProductField,
  type ProductFormState,
} from '@/lib/admin/product-form';
import { SpecRowsField } from './SpecRowsField';

interface ProductDialogProps {
  open: boolean;
  /** The product to edit, or null to add one. */
  product: AdminProduct | null;
  categories: AdminCategory[];
  /** A category to start a new product in: the tab the admin was looking at. */
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: (state: ProductFormState) => void;
}

/** Field order in the form, and the control each error sends focus to. */
const FOCUS: Array<[ProductField, string]> = [
  ['name', '[name="name"]'],
  ['categoryId', '[name="category_id"]'],
  ['price', '[name="price"]'],
  ['priceNote', '[name="price_note"]'],
  ['sku', '[name="sku"]'],
  ['stock', '[name="stock"]'],
  ['description', '[name="description"]'],
  ['photo', '.fhd-photos__add button, .fhd-photos button'],
  ['details', '[name="details"]'],
  ['specs', '.spec-rows [aria-invalid="true"], .spec-rows button'],
  ['slug', '[name="slug"]'],
];

const PROBLEM: Partial<Record<ProductFormState['status'], { title: string; body: string }>> = {
  'signed-out': { title: 'Your session ended', body: 'Sign in again in another tab, then save. What you typed stays here.' },
  missing: { title: 'This product is gone', body: 'It was removed elsewhere, so there is nothing to save. Close this form.' },
  error: { title: 'That did not save', body: 'Nothing was changed. Try again in a moment.' },
};

const PHOTO_PROBLEM = 'Pick JPEG, PNG or WebP photos up to 5 MB each.';
const UPLOAD_PROBLEM = 'A photo did not upload. Add it again.';

type Photo = { path: string; url: string };

/** Adds or edits a product. Photos upload as soon as they are picked, so Save is quick. */
export function ProductDialog({ open, product, categories, defaultCategoryId, onClose, onSaved }: ProductDialogProps) {
  const isNew = !product;
  // A new product's id is made here, so its photo can upload into its own folder before it is saved.
  const [id] = useState(() => product?.id ?? crypto.randomUUID());
  const [state, setState] = useState<ProductFormState>(INITIAL_PRODUCT_STATE);
  const [pending, startTransition] = useTransition();
  const [description, setDescription] = useState(product?.description ?? '');
  const [details, setDetails] = useState(product?.details ?? '');
  const [photos, setPhotos] = useState<Photo[]>(product?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string>();
  // Set while photos upload, so a second pick can never start a second run of uploads beside it.
  const busy = useRef(false);
  // Photos uploaded while this form was open. Any the product does not end up using are tidied away.
  const uploaded = useRef<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const formId = `product-form-${id}`;
  const errors = state.errors ?? {};
  const problem = PROBLEM[state.status];

  useEffect(() => {
    if (state.status === 'invalid') {
      const first = FOCUS.find(([field]) => state.errors?.[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(first[1])?.focus();
    } else if (PROBLEM[state.status]) {
      problemRef.current?.focus();
    }
  }, [state]);

  function tidy(keep: readonly string[]) {
    // The product's own photos stay until a save takes them off; the server removes them then.
    const spare = uploaded.current.filter((path) => !keep.includes(path) && !product?.photos.some((photo) => photo.path === path));
    uploaded.current = [];
    if (spare.length) void discardPhotos(id, spare);
  }

  function close() {
    if (pending || uploading) return;
    tidy([]);
    onClose();
  }

  /** Uploads the picked files one after another, adding each to the end of the list as it lands. */
  async function choose(files: File[]) {
    if (busy.current) return;
    const usable = files.filter((file) => photoEnding(file.type) && file.size <= PHOTO_MAX_BYTES);
    let problem: string | undefined = usable.length < files.length ? PHOTO_PROBLEM : undefined;
    setPhotoError(problem);
    if (!usable.length) return;
    busy.current = true;
    setUploading(true);
    try {
      for (const file of usable) {
        const ticket = await startPhotoUpload(id, file.type, file.size);
        if (!ticket.ok) {
          if (ticket.reason === 'signed-out') {
            problem = 'Your session ended. Sign in again, then add the photos.';
            break;
          }
          problem = ticket.reason === 'type' ? PHOTO_PROBLEM : UPLOAD_PROBLEM;
          continue;
        }
        const response = await fetch(ticket.url, {
          method: 'PUT',
          body: file,
          headers: {
            'content-type': file.type,
            'x-upsert': 'false',
            // Each upload has a new name, so a browser may keep it for a year.
            'cache-control': 'max-age=31536000',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
          },
        });
        if (!response.ok) {
          problem = response.status === 413 || response.status === 415 || response.status === 400 ? PHOTO_PROBLEM : UPLOAD_PROBLEM;
          continue;
        }
        uploaded.current.push(ticket.path);
        const added = { path: ticket.path, url: ticket.publicUrl };
        // A full list (photos removed and re-added meanwhile) leaves the upload spare; closing or saving tidies it.
        setPhotos((current) => (current.length < PRODUCT_LIMITS.photos ? [...current, added] : current));
      }
    } catch {
      problem = 'A photo did not upload. Check your connection and add it again.';
    } finally {
      busy.current = false;
      setUploading(false);
      setPhotoError(problem);
    }
  }

  function movePhoto(from: number, to: number) {
    setPhotos((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      if (moved) next.splice(to, 0, moved);
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || uploading) return;
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveProduct(state, data);
      if (result.status === 'saved') {
        tidy(result.photos ?? []);
        onSaved(result);
      } else {
        setState(result);
      }
    });
  }

  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));

  return (
    <Dialog
      open={open}
      onClose={close}
      size="md"
      title={isNew ? 'Add product' : 'Edit product'}
      description={
        isNew
          ? 'It stays off the storefront until you tick Show in catalog.'
          : 'Clients see your changes as soon as you save.'
      }
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={pending} disabled={uploading}>
            {isNew ? 'Add product' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form ref={formRef} id={formId} className="admin-form" onSubmit={submit} noValidate aria-busy={pending || undefined}>
        {problem ? (
          <div ref={problemRef} tabIndex={-1}>
            <Alert tone="danger" className="fhd-appear" title={problem.title}>
              {problem.body}
            </Alert>
          </div>
        ) : null}
        {product?.isSample ? (
          <Alert tone="info" title="This is a sample listing">
            Replace the sample details with real ones. Saving marks it as a real product.
          </Alert>
        ) : null}

        <input type="hidden" name="id" value={id} />
        {isNew ? <input type="hidden" name="is_new" value="yes" /> : null}
        {photos.map((photo) => (
          <input key={photo.path} type="hidden" name="photos" value={photo.path} />
        ))}

        <TextField name="name" label="Name" required maxLength={PRODUCT_LIMITS.name} defaultValue={product?.name} error={errors.name} />
        <Select
          name="category_id"
          label="Category"
          required
          options={categoryOptions}
          placeholder="Choose a category"
          defaultValue={product?.categoryId ?? defaultCategoryId ?? ''}
          error={errors.categoryId}
        />
        <div className="admin-form__pair">
          <TextField
            name="price"
            label="Price"
            prefix="$"
            inputMode="decimal"
            maxLength={16}
            defaultValue={priceText(product?.priceCents ?? null)}
            hint="Leave empty if you quote each order."
            error={errors.price}
          />
          <TextField
            name="price_note"
            label="Price note"
            maxLength={PRODUCT_LIMITS.priceNote}
            defaultValue={product?.priceNote}
            hint="Under the price: per unit, case of 12."
            error={errors.priceNote}
          />
        </div>
        <div className="admin-form__pair">
          <TextField
            name="sku"
            label="SKU"
            required
            spellCheck={false}
            autoCapitalize="characters"
            maxLength={PRODUCT_LIMITS.sku}
            defaultValue={product?.sku}
            error={errors.sku}
          />
          <Select name="stock" label="Stock" required options={[...STOCK_OPTIONS]} defaultValue={product?.stock ?? 'in_stock'} error={errors.stock} />
        </div>
        <TextField
          name="description"
          label="Description"
          multiline
          rows={3}
          maxLength={PRODUCT_LIMITS.description}
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          hint={`On the product card. ${description.length} of ${PRODUCT_LIMITS.description} characters.`}
          error={errors.description}
        />
        <PhotosField
          label="Photos"
          hint="JPEG, PNG or WebP, up to 5 MB each. The first is the cover on the product card. Cropped to 4:3, as on the storefront."
          max={PRODUCT_LIMITS.photos}
          photos={photos.map((photo) => ({ key: photo.path, src: photo.url }))}
          busy={uploading}
          error={photoError ?? errors.photo}
          onSelect={(files) => void choose(files)}
          onMove={movePhoto}
          onRemove={(index) => setPhotos((current) => current.filter((_, at) => at !== index))}
        />
        <Checkbox
          name="visible"
          value="yes"
          label="Show in catalog"
          hint="Clients can see it and ask for a quote."
          defaultChecked={product?.visible ?? false}
        />

        <div className="admin-form__section">
          <h3 className="display-sm admin-form__heading">Product page</h3>
          <p className="caption admin-form__lead">The page clients open from the product card.</p>
        </div>
        <TextField
          name="details"
          label="Page text"
          multiline
          rows={6}
          maxLength={PRODUCT_LIMITS.details}
          value={details}
          onChange={(event) => setDetails(event.currentTarget.value)}
          hint={`Leave a blank line between paragraphs. ${details.length.toLocaleString('en-US')} of ${PRODUCT_LIMITS.details.toLocaleString('en-US')} characters.`}
          error={errors.details}
        />
        <SpecRowsField initial={product?.specs ?? []} error={errors.specs} rowErrors={state.specErrors} />
        <TextField
          name="slug"
          label="Page address"
          prefix="/products/"
          spellCheck={false}
          autoCapitalize="none"
          maxLength={PRODUCT_LIMITS.slug}
          defaultValue={product?.slug}
          required={!isNew}
          hint={isNew ? 'Leave empty to make one from the name.' : 'Changing it breaks links people have saved.'}
          error={errors.slug}
        />
      </form>
    </Dialog>
  );
}
