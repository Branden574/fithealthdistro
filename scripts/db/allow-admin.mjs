// Adds an existing Supabase Auth user to the admin allowlist. Create or invite the user first
// (Supabase dashboard > Authentication > Users > Invite user), then run:
//   npm run db:allow-admin -- --email ryan@example.com --name Ryan [--linked]
import { arg, linked, literal, runSql } from './run-sql.mjs';

const email = (arg('email') || '').trim().toLowerCase();
const name = (arg('name') || '').trim();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Give the admin’s email: --email someone@example.com');
  process.exit(1);
}
const out = runSql(`
  insert into public.admins (user_id, email, name)
  select u.id, lower(u.email), ${literal(name)} from auth.users u where lower(u.email) = ${literal(email)}
  on conflict (user_id) do update set name = excluded.name
  returning email;`);
if (!out.includes(email)) {
  console.error(`No Supabase Auth user has the email ${email}. Invite them first, then run this again.`);
  process.exit(1);
}
console.log(`${email} is an admin on the ${linked ? 'hosted' : 'local'} database.`);
