import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { requireAdmin } from '@/lib/admin/auth';
import { createSessionClient } from '@/lib/supabase/server';

/** Reads the session on every request, so it never comes from a cache. */
export const instant = false;

/** Every signed-in admin page: the sidebar, then the page. The proxy sends anyone signed out to sign in first. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const supabase = await createSessionClient();
  const { count } = await supabase.from('products').select('id', { count: 'exact', head: true });
  return (
    <div className="admin">
      <a className="skip-link" href="#admin-main">
        Skip to content
      </a>
      <AdminSidebar name={admin.name} productCount={count ?? undefined} />
      <main id="admin-main" className="admin__main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
