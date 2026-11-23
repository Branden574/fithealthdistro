import { Panel } from '@ds';
import { AdminPageHead } from './AdminPageHead';

/** Shown while an admin page loads: its title at once, and a quiet panel where the content will be. */
export function AdminLoading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <AdminPageHead eyebrow={eyebrow} title={title} />
      <Panel aria-busy="true">
        <p className="admin-muted" role="status">
          Loading {title.toLowerCase()}
        </p>
      </Panel>
    </>
  );
}
