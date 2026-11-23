import { PreviewBar } from '@/components/admin/PreviewBar';

/** Shown while a preview page reads the drafts. */
export default function Loading() {
  return (
    <>
      <PreviewBar />
      <div className="section">
        <p className="wrap body-sm preview-loading" role="status">
          Loading the preview
        </p>
      </div>
    </>
  );
}
