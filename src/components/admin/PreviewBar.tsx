import { Badge, Button } from '@ds';
import { CONTENT_PATH, PREVIEW_PATH } from '@/lib/admin/paths';

const PAGES = [
  { id: 'home', label: 'Home', href: PREVIEW_PATH },
  { id: 'terms', label: 'Terms', href: `${PREVIEW_PATH}/terms` },
  { id: 'privacy', label: 'Privacy', href: `${PREVIEW_PATH}/privacy` },
] as const;

/**
 * Across the top of a draft preview: what this is, the pages to look at, and the way back to the editor. Product pages
 * are reached from the catalog, so none of the buttons is current on one.
 */
export function PreviewBar({ current }: { current?: (typeof PAGES)[number]['id'] | 'product' }) {
  return (
    <div className="preview-bar" data-theme="dark" role="region" aria-label="Draft preview">
      <div className="wrap preview-bar__inner">
        <p className="preview-bar__note body-sm">
          <Badge tone="accent">Preview</Badge>
          <span>Saved drafts, before Publish. Visitors still see the live site.</span>
        </p>
        <nav className="row preview-bar__pages" aria-label="Pages to preview">
          {PAGES.map((page) => (
            <Button key={page.id} size="sm" variant={page.id === current ? 'solid' : 'ghost'} href={page.href} aria-current={page.id === current ? 'page' : undefined}>
              {page.label}
            </Button>
          ))}
        </nav>
        <Button size="sm" iconLeft="arrow-left" href={CONTENT_PATH}>
          Back to Site content
        </Button>
      </div>
    </div>
  );
}
