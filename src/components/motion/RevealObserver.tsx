'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Fades sections marked data-reveal in the first time they scroll into view, once each.
 * Only sections that are off screen when this runs are hidden ("pending"), so nothing a visitor can already see
 * disappears, and without this script nothing is ever hidden. Reduced motion skips it entirely.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-reveal', 'done');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    const sections = document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal="done"]):not([data-reveal="pending"])');
    for (const section of sections) {
      const box = section.getBoundingClientRect();
      const onScreen = box.top < window.innerHeight && box.bottom > 0;
      if (onScreen) continue;
      section.setAttribute('data-reveal', 'pending');
      observer.observe(section);
    }
    return () => {
      observer.disconnect();
      // Anything still waiting is shown, so leaving the page never strands hidden content.
      document.querySelectorAll('[data-reveal="pending"]').forEach((node) => node.setAttribute('data-reveal', ''));
    };
  }, [pathname]);
  return null;
}
