import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

/** Lets search engines read the storefront and points them at the sitemap. The admin and draft previews are off limits. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/preview'] },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
