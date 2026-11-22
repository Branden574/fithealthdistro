import type { ReactNode } from 'react';
import { LiveRegion } from '@/components/a11y/LiveRegion';

/** Each storefront page renders its own shell from its own content (see StorefrontShell), so a draft preview can reuse it. */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <LiveRegion />
    </>
  );
}
