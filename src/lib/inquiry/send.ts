'use server';

import { createHmac, randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { getCatalog } from '@/lib/catalog';
import { t, type Copy } from '@/lib/copy';
import { getPublishedCopy } from '@/lib/content/storefront';
import { createServiceClient } from '@/lib/supabase/service';
import { readContactForm, validateContact, type ContactInput, type ContactState, type ContactValues } from './form';

/**
 * The key for hashing addresses. RATE_LIMIT_SALT when it is set; otherwise one derived from the server's secret key, so
 * the per-address limit never silently switches off (without it, one script could spend the site-wide cap for everyone).
 * Never a plain hash: every IPv4 address can be hashed in minutes, so an unkeyed hash would not hide anything.
 */
function addressKey(): string | undefined {
  const salt = process.env.RATE_LIMIT_SALT;
  if (salt) return salt;
  const secret = process.env.SUPABASE_SECRET_KEY;
  return secret ? createHmac('sha256', secret).update('fhd.rate-limit.v1').digest('hex') : undefined;
}

/**
 * A keyed hash of the visitor's address, for the per-address rate limit. The address itself is never stored.
 * On Vercel these headers are set by the platform and cannot be supplied by the visitor. Behind another proxy, check
 * which header it sets before relying on this.
 */
async function addressHash(): Promise<string | undefined> {
  const salt = addressKey();
  if (!salt) return undefined;
  const list = await headers();
  const first = (name: string) => list.get(name)?.split(',')[0]?.trim() || undefined;
  const address = first('x-vercel-forwarded-for') ?? first('x-real-ip') ?? first('x-forwarded-for');
  return address ? createHmac('sha256', salt).update(address).digest('hex') : undefined;
}

function valuesOf(input: ContactInput): ContactValues {
  return {
    name: input.name,
    company: input.company,
    email: input.email,
    phone: input.phone,
    message: input.message,
    interests: input.interests,
    productIds: input.productIds,
    terms: input.terms,
    marketing: input.marketing,
  };
}

/** The consent wording exactly as the form showed it, with the dates of the policies it pointed to. Kept on the inquiry. */
function consentText(copy: Copy, marketing: boolean): string {
  const terms = t(copy, 'contact.form.terms', {
    terms: t(copy, 'contact.form.terms.link'),
    privacy: t(copy, 'contact.form.privacy.link'),
  });
  const dated = `(${t(copy, 'contact.form.terms.link')}: ${t(copy, 'terms.updated')}. ${t(copy, 'contact.form.privacy.link')}: ${t(copy, 'privacy.updated')}.)`;
  return [terms, dated, marketing ? t(copy, 'contact.form.marketing') : ''].filter(Boolean).join(' ').slice(0, 1000);
}

/** Receives the contact form. Validates everything again here; the browser's checks are only a convenience. */
export async function sendRequest(previous: ContactState, form: FormData): Promise<ContactState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const input = readContactForm(form);

  // A filled honeypot gets the same answer as a real request, so a bot learns nothing, and nothing is saved.
  if (input.trap) return { status: 'sent', attempt };

  try {
    return await record(input, attempt);
  } catch (error) {
    // A failed read or a missing setting: the visitor keeps the form and what they typed, with "We could not send your
    // request". Only the error's own message is logged, and the loaders' messages never contain what the visitor typed.
    console.error(`sendRequest failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    return { status: 'error', attempt, values: valuesOf(input) };
  }
}

async function record(input: ContactInput, attempt: number): Promise<ContactState> {
  const [{ categories, products }, copy] = await Promise.all([getCatalog(), getPublishedCopy()]);

  // What the visitor is asking about: the categories they ticked, and the categories of the products they picked,
  // in catalog order. Unknown categories and products are ignored.
  const picked = new Set(input.productIds);
  const ticked = new Set(input.interests);
  for (const product of products) if (picked.has(product.id)) ticked.add(categories.find((c) => c.id === product.categoryId)?.slug ?? '');
  const interests = categories.filter((category) => ticked.has(category.slug));

  const values = valuesOf(input);
  const errors = validateContact(
    input,
    interests.map((category) => category.slug),
  );
  if (Object.keys(errors).length) return { status: 'invalid', attempt, errors, values };

  const { data, error } = await createServiceClient().rpc('submit_inquiry', {
    p: {
      // A resend of the same form carries the same id, so it is recorded once.
      submission_id: input.submissionId ?? randomUUID(),
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      // Stored as the category names, so the inquiry reads the same after a category is renamed.
      interest: interests.map((category) => category.name).join(', ').slice(0, 200),
      message: input.message,
      product_ids: input.productIds,
      terms_accepted: input.terms,
      marketing_opt_in: input.marketing,
      consent_text: consentText(copy, input.marketing),
      ip_hash: (await addressHash()) ?? null,
    },
  });

  if (error) {
    // The code and message only: the details of a database error can repeat what the visitor typed.
    console.error(`submit_inquiry failed: ${error.code} ${error.message}`);
    return { status: 'error', attempt, values };
  }

  const result = data as { status?: unknown; field?: unknown } | null;
  if (result?.status === 'ok') return { status: 'sent', attempt };
  if (result?.status === 'rate_limited') return { status: 'rate_limited', attempt, values };
  if (result?.status === 'invalid') {
    const field = result.field === 'terms' ? 'terms' : 'email';
    return { status: 'invalid', attempt, errors: { [field]: field === 'terms' ? 'required' : 'invalid' }, values };
  }
  console.error(`submit_inquiry returned an unexpected status: ${String(result?.status)}`);
  return { status: 'error', attempt, values };
}
