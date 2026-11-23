'use client';

import { useEffect } from 'react';
import { noteVisit } from '@/lib/inquiry/visit';

/** Notes how the visitor found the site, once per page load, for the request they may send. Renders nothing. */
export function VisitSource() {
  useEffect(() => {
    noteVisit();
  }, []);
  return null;
}
