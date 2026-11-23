import 'server-only';
import { requireAdmin } from '@/lib/admin/auth';
import { getCatalog, getPublicSettings } from '@/lib/catalog';
import { createSessionClient } from '@/lib/supabase/server';
import type { StorefrontPageData } from './page-data';
import { toStorefrontContent } from './storefront';

/**
 * The storefront as it will be after Publish: saved draft copy and the proposed FAQ, read as the signed-in admin. Never
 * cached: it reads the session, and /preview is sent with no-store headers. Products and settings are the live ones;
 * they have no drafts.
 */
export async function getPreviewPageData(): Promise<StorefrontPageData> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [draft, catalog, settings] = await Promise.all([supabase.rpc('get_draft_content'), getCatalog(), getPublicSettings()]);
  if (draft.error) throw new Error(`Could not load the draft content: ${draft.error.message}`);
  const { copy, faqs } = toStorefrontContent(draft.data);
  return { copy, faqs, catalog, settings };
}
