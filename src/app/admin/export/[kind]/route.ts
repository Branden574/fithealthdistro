import { getAdmin } from '@/lib/admin/auth';
import { buildExport, isExportKind } from '@/lib/admin/exports';

/** Kept out of every cache, and never read as anything but what it says it is. */
const PRIVATE = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex',
} as const;

const text = (body: string, status: number) => new Response(body, { status, headers: { ...PRIVATE, 'Content-Type': 'text/plain; charset=utf-8' } });

/**
 * A spreadsheet download for an admin: /admin/export/inquiries, clients, orders or marketing. The proxy sends a visitor
 * without a session to sign in; this checks the admin allowlist itself, and the database checks it again on every read.
 */
export async function GET(_request: Request, ctx: RouteContext<'/admin/export/[kind]'>) {
  const { kind } = await ctx.params;
  if (!isExportKind(kind)) return text('Not found.', 404);
  try {
    if (!(await getAdmin())) return text('Sign in as an admin to download this.', 403);
    const { filename, csv } = await buildExport(kind);
    return new Response(csv, {
      headers: { ...PRIVATE, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` },
    });
  } catch (error) {
    console.error(`export ${kind} failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    return text('Could not build the file. Try again in a minute.', 500);
  }
}
