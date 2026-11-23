'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TIME_ZONE_COOKIE } from '@/lib/admin/format';

/**
 * Tells the server which time zone this browser is in, so admin dates match the admin's clock. Only when it differs
 * from what the server used: the first visit, after travelling, or after the cookie was cleared. Then the page redraws
 * once with the right times.
 */
export function TimeZoneSync({ used }: { used: string }) {
  const router = useRouter();
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone || zone === used) return;
    const value = encodeURIComponent(zone);
    // Already sent and still not used: the server cannot read this zone, so the page stays in UTC instead of redrawing
    // forever.
    if (document.cookie.split('; ').includes(`${TIME_ZONE_COOKIE}=${value}`)) return;
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${TIME_ZONE_COOKIE}=${value}; path=/admin; max-age=31536000; samesite=lax${secure}`;
    router.refresh();
  }, [used, router]);
  return null;
}
