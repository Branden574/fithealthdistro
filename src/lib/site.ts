import type { Metadata } from 'next';

/** The business's legal and trading name, as on the logo. The storefront's wording is site copy; this is for machines. */
export const BUSINESS_NAME = 'Fit Health Distributing';

/**
 * The site's public address, for canonical links, the sitemap, structured data and link previews. On Vercel it is the
 * production domain (the custom domain once one is set), so preview deployments still point search engines and shared
 * links at the live site. Locally it is the dev server.
 */
export function siteUrl(): URL {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(host ? `https://${host}` : `http://localhost:${process.env.PORT ?? 3000}`);
}

/** An absolute address on the site, from a path ("/products/x"). */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).href;
}

/** The picture shown when a page is shared and has none of its own: the logo on the brand's near-black. */
export const SHARE_IMAGE = { url: '/brand/share.png', width: 1200, height: 630, alt: `${BUSINESS_NAME} logo` } as const;

/** The logo as a raster file, for search engines that want one (structured data). */
export const LOGO_IMAGE = '/brand/fhd-logo.png';

interface ShareInput {
  title: string;
  description?: string;
  /** The page's own address ("/products/x"): its canonical link. Leave it out where there is no single page (the layout). */
  path?: string;
  /** The page's own picture, such as a product photo. Without one, the logo image. */
  image?: { url: string; alt: string } | null;
}

/**
 * What a shared link shows, and the page's canonical address. A page's own `openGraph` replaces its layout's whole
 * object rather than merging with it, so every page that sets one builds it here and nothing goes missing.
 */
export function shareMetadata({ title, description, path, image }: ShareInput): Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'> {
  const images = image ? [image] : [SHARE_IMAGE];
  return {
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: { type: 'website', siteName: BUSINESS_NAME, locale: 'en_US', title, description, images, ...(path ? { url: path } : {}) },
    twitter: { card: 'summary_large_image', title, description, images: images.map((item) => item.url) },
  };
}
