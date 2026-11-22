// Loads every slot in design-system/site-copy.json into the content store.
//   New slots are added with their original wording live. Existing slots get their label, limit and original updated.
//   Drafts and published text are never touched.
// Usage: npm run db:sync-copy            (local)
//        npm run db:sync-copy -- --linked (hosted project)
import fs from 'node:fs';
import { linked, runSql } from './run-sql.mjs';

const { slots } = JSON.parse(fs.readFileSync(new URL('../../design-system/site-copy.json', import.meta.url), 'utf8'));
const json = JSON.stringify(slots);
if (json.includes('$fhd_copy$')) throw new Error('site-copy.json contains the SQL quote tag $fhd_copy$.');
const out = runSql(`select public.sync_site_copy($fhd_copy$${json}$fhd_copy$::jsonb) as slots;`);
console.log(`Synced ${slots.length} slots to the ${linked ? 'hosted' : 'local'} database.`, out.includes('"slots"') ? '' : out);
