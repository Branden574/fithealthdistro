import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// The design system, once, globally: tokens first (they declare the fonts), then the component styles.
import '../../design-system/tokens.css';
import '../../design-system/components/bundle.css';
import './globals.css';
import { t } from '@/lib/copy';
import { getPublishedCopy } from '@/lib/content/storefront';
import { shareMetadata, siteUrl } from '@/lib/site';

// The icons are files beside this layout (icon.svg, favicon.ico, apple-icon.png), which Next.js links on its own.
export async function generateMetadata(): Promise<Metadata> {
  const copy = await getPublishedCopy();
  const title = t(copy, 'meta.title');
  const description = t(copy, 'meta.description');
  return {
    metadataBase: siteUrl(),
    // Other pages give only their own name; the template around it is site copy ("{name} | Fit Health Distributing").
    title: { default: title, template: t(copy, 'meta.page.title', { name: '%s' }) },
    description,
    ...shareMetadata({ title, description }),
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-scroll-behavior lets Next.js turn smooth scrolling off during route changes, so navigation stays instant.
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
