import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { TimeZoneSync } from '@/components/admin/TimeZoneSync';
import { requireAdmin } from '@/lib/admin/auth';
import { adminTimeZone } from '@/lib/admin/time';
import { createSessionClient } from '@/lib/supabase/server';

/** Reads the session on every request, so it never comes from a cache. */
export const instant = false;

/** Every signed-in admin page: the sidebar, then the page. The proxy sends anyone signed out to sign in first. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const supabase = await createSessionClient();
  const [products, inquiries, zone] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    adminTimeZone(),
  ]);
  return (
    <div className="admin">
      <a className="skip-link" href="#admin-main">
        Skip to content
      </a>
      <AdminSidebar name={admin.name} productCount={products.count ?? undefined} newInquiries={inquiries.count ?? undefined} />
      <main id="admin-main" className="admin__main" tabIndex={-1}>
        {children}
      </main>
      <TimeZoneSync used={zone} />
    </div>
  );
}
