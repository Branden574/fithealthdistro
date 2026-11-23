'use client';

import { cleanHost, cleanSource, EMPTY_SOURCE, type InquirySource } from './source';

/**
 * How this visit found the site, kept in the tab (sessionStorage) until it closes and sent only with a request, as the
 * privacy page says. A visit that arrives from another site or a tagged link replaces what is kept; one that arrives
 * from this site, a bookmark or a typed address keeps the earlier one.
 */
const KEY = 'fhd:visit-source';

/** Notes the visit. Call once per page load. Not in the admin's draft preview, which cannot send. */
export function noteVisit() {
  const { hostname, pathname, search } = window.location;
  if (pathname === '/preview' || pathname.startsWith('/preview/')) return;

  let referrerHost = '';
  try {
    if (document.referrer) {
      const from = cleanHost(new URL(document.referrer).hostname);
      if (from && from !== cleanHost(hostname)) referrerHost = from;
    }
  } catch {
    // An unreadable referrer is the same as none.
  }

  const params = new URLSearchParams(search);
  // Ad clicks that carry only Google's or Facebook's click id still name where they came from.
  const fallback = params.has('gclid') ? 'google' : params.has('fbclid') ? 'facebook' : '';
  const touch = cleanSource({
    referrerHost,
    utmSource: params.get('utm_source') || fallback,
    utmMedium: params.get('utm_medium') || (params.has('gclid') ? 'cpc' : ''),
    utmCampaign: params.get('utm_campaign') ?? '',
    landingPath: pathname,
  });
  const fromOutside = Boolean(touch.referrerHost || touch.utmSource || touch.utmMedium || touch.utmCampaign);

  try {
    if (fromOutside || !window.sessionStorage.getItem(KEY)) window.sessionStorage.setItem(KEY, JSON.stringify(touch));
  } catch {
    // Storage turned off: the request is sent without a source.
  }
}

/** What noteVisit kept, cleaned again in case the stored value was changed. Empty when there is none. */
export function visitSource(): InquirySource {
  try {
    const stored = window.sessionStorage.getItem(KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    return parsed && typeof parsed === 'object' ? cleanSource(parsed as Record<string, unknown>) : EMPTY_SOURCE;
  } catch {
    return EMPTY_SOURCE;
  }
}
