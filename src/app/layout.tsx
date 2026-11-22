import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// The design system, once, globally: tokens first (they declare the fonts), then the component styles.
import '../../design-system/tokens.css';
import '../../design-system/components/bundle.css';
import './globals.css';
import { t } from '@/lib/copy';
import { getPublishedCopy } from '@/lib/copy/published';

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getPublishedCopy();
  return {
    title: { default: t(copy, 'meta.title'), template: `%s · ${t(copy, 'meta.title')}` },
    description: t(copy, 'meta.description'),
    icons: { icon: '/favicon.svg' },
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
