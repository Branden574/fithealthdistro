import { ORIGINAL_COPY, type Copy } from './index';

/**
 * The copy visitors see. Stage 2 reads the published snapshot from the database and lays it over the originals,
 * so a slot added to site-copy.json shows its original wording until someone publishes a change to it.
 */
export async function getPublishedCopy(): Promise<Copy> {
  return ORIGINAL_COPY;
}
