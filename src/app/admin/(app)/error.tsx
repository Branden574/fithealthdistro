'use client';

import { Alert, Button } from '@ds';

/** When an admin page cannot load (the database is unreachable, say): what happened, and a way to try again. */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Alert
      tone="danger"
      title="This page did not load"
      action={
        <Button size="sm" variant="outline" iconLeft="arrows-clockwise" onClick={reset}>
          Try again
        </Button>
      }
    >
      Nothing was changed. Check your connection, then try again.
    </Alert>
  );
}
