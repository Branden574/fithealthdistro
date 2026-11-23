import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * The draft preview reads the admin's session and their saved drafts on every request, so none of it is prerendered
 * or cached. The proxy sends anyone signed out to sign in, each page checks the allowlist again, and next.config.ts
 * sends these pages with no-store and noindex headers.
 */
export const instant = false;

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return children;
}
