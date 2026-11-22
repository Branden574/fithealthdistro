import { Hero } from '@/components/storefront/Hero';
import { getPublishedCopy } from '@/lib/copy/published';

export default async function HomePage() {
  const copy = await getPublishedCopy();
  // Catalog, FAQ and contact sections arrive in Stage 3, once the database is in place.
  return <Hero copy={copy} />;
}
