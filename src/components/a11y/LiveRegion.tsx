'use client';

import { useSyncExternalStore } from 'react';
import { announcer } from '@/lib/a11y/announce';

/** The page's one polite status region. Visually hidden; it exists from the first render so screen readers are already listening. */
export function LiveRegion() {
  const message = useSyncExternalStore(announcer.subscribe, announcer.getSnapshot, announcer.getServerSnapshot);
  return (
    <div className="fhd-sr" role="status">
      {message}
    </div>
  );
}
