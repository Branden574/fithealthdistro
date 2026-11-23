/**
 * Where a visitor came from, sent with their inquiry: the website that sent them (host name only), the utm_source,
 * utm_medium and utm_campaign tags of the link they followed, and the first page they opened. The browser notes it on
 * arrival (lib/inquiry/visit.ts) and the form sends it; the server cleans it again here and the database once more.
 * A part that does not fit is left empty, never refused: a lead matters more than knowing where it came from.
 */
export interface InquirySource {
  referrerHost: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  landingPath: string;
}

export const EMPTY_SOURCE: InquirySource = { referrerHost: '', utmSource: '', utmMedium: '', utmCampaign: '', landingPath: '' };

/** The form fields that carry it. */
export const SOURCE_FIELDS: Readonly<Record<keyof InquirySource, string>> = {
  referrerHost: 'source_referrer',
  utmSource: 'source_utm_source',
  utmMedium: 'source_utm_medium',
  utmCampaign: 'source_utm_campaign',
  landingPath: 'source_landing',
};

/** Limits match the inquiries table. Nothing longer than RAW_MAX is read at all. */
const HOST_MAX = 253;
const TAG_MAX = 100;
const PATH_MAX = 200;
export const SOURCE_RAW_MAX = 400;

// Labels of letters, digits and inner hyphens, joined by dots. Only ever run on at most HOST_MAX characters.
const HOST = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;
// A path on this site: one leading slash, no spaces or control characters. Only ever run on at most PATH_MAX characters.
const PATH = /^\/(?!\/)[^\s\u0000-\u001f\u007f]*$/;

/** "www.Google.com." becomes "google.com"; anything that is not a host name becomes empty. */
export function cleanHost(value: string): string {
  const host = value.slice(0, SOURCE_RAW_MAX).trim().toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  return host.length <= HOST_MAX && HOST.test(host) ? host : '';
}

/** A campaign tag in lower case without accents ("Été" is "ete"), with anything but a-z, 0-9 and _ . + - as one space. */
export function cleanTag(value: string): string {
  return value
    .slice(0, SOURCE_RAW_MAX)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9 _.+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, TAG_MAX)
    .trim();
}

/** The page without its query or fragment, so nothing typed into a search or a form is kept. */
export function cleanPath(value: string): string {
  const path = value.slice(0, SOURCE_RAW_MAX).split(/[?#]/, 1)[0].slice(0, PATH_MAX);
  return PATH.test(path) ? path : '';
}

export function cleanSource(raw: Partial<Record<keyof InquirySource, unknown>>): InquirySource {
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  return {
    referrerHost: cleanHost(text(raw.referrerHost)),
    utmSource: cleanTag(text(raw.utmSource)),
    utmMedium: cleanTag(text(raw.utmMedium)),
    utmCampaign: cleanTag(text(raw.utmCampaign)),
    landingPath: cleanPath(text(raw.landingPath)),
  };
}

/** Reads the source from the form's fields. */
export function readSource(get: (field: string) => string): InquirySource {
  return cleanSource({
    referrerHost: get(SOURCE_FIELDS.referrerHost),
    utmSource: get(SOURCE_FIELDS.utmSource),
    utmMedium: get(SOURCE_FIELDS.utmMedium),
    utmCampaign: get(SOURCE_FIELDS.utmCampaign),
    landingPath: get(SOURCE_FIELDS.landingPath),
  });
}
