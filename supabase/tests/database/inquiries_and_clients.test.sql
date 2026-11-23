-- Inquiries and clients in the admin. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000005a1', 'inquiry-owner@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000005b2', 'inquiry-someone@example.test', 'authenticated', 'authenticated');
insert into public.admins (user_id, email, name) values ('00000000-0000-4000-8000-0000000005a1', 'inquiry-owner@example.test', 'Owner');

insert into public.clients (id, email, name, marketing_opt_in, marketing_opt_in_at, first_active_at, last_active_at, created_at) values
  ('00000000-0000-4000-8000-00000000e501', 'dana@example.test', 'Dana', true, now() - interval '3 days',
   now() - interval '40 days', now() - interval '40 days', now() - interval '40 days');
insert into public.inquiries (id, submission_id, client_id, name, email, interest, created_at) values
  ('00000000-0000-4000-8000-00000000f501', gen_random_uuid(), '00000000-0000-4000-8000-00000000e501', 'Dana', 'dana@example.test', 'Drinks', now() - interval '40 days');
insert into public.client_activity (client_id, kind, inquiry_id, occurred_at, created_at) values
  ('00000000-0000-4000-8000-00000000e501', 'inquiry', '00000000-0000-4000-8000-00000000f501', now() - interval '40 days', now() - interval '40 days');

-- ---------------------------------------------------------------------------------------------------------------
-- As the admin
-- ---------------------------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000005a1", "role": "authenticated"}', true);

-- Status
select lives_ok($$ update public.inquiries set status = 'read' where id = '00000000-0000-4000-8000-00000000f501' $$, 'an admin marks an inquiry read');
select ok((select read_at is not null and replied_at is null from public.inquiries where id = '00000000-0000-4000-8000-00000000f501'), 'the time it was read is stamped');
select lives_ok($$ update public.inquiries set status = 'replied' where id = '00000000-0000-4000-8000-00000000f501' $$, 'an admin marks it replied');
select ok((select replied_at is not null and read_at is not null from public.inquiries where id = '00000000-0000-4000-8000-00000000f501'), 'the reply time is stamped and the read time kept');
select lives_ok($$ update public.inquiries set status = 'new' where id = '00000000-0000-4000-8000-00000000f501' $$, 'an admin moves it back to new');
select ok((select read_at is null and replied_at is null from public.inquiries where id = '00000000-0000-4000-8000-00000000f501'), 'and both times clear');
select throws_ok($$ update public.inquiries set read_at = now() - interval '1 year' where id = '00000000-0000-4000-8000-00000000f501' $$,
  '42501', null, 'an admin cannot write the read time directly');
select throws_ok($$ update public.inquiries set message = 'Changed' where id = '00000000-0000-4000-8000-00000000f501' $$,
  '42501', null, 'nor change what the client wrote');

-- Marketing
select lives_ok($$ update public.clients set marketing_opt_in = false where id = '00000000-0000-4000-8000-00000000e501' $$, 'an admin records an opt-out');
select ok((select not marketing_opt_in and marketing_opt_out_at is not null from public.clients where id = '00000000-0000-4000-8000-00000000e501'),
  'the opt-out time is recorded');
select throws_ok($$ update public.clients set marketing_opt_in = true where id = '00000000-0000-4000-8000-00000000e501' $$,
  '42501', null, 'an admin cannot opt a client in');
select throws_ok($$ update public.clients set marketing_opt_out_at = null where id = '00000000-0000-4000-8000-00000000e501' $$,
  '42501', null, 'nor erase the opt-out time');
select lives_ok($$ update public.clients set name = 'Dana Whitfield', company = 'Northside Fitness' where id = '00000000-0000-4000-8000-00000000e501' $$,
  'an admin corrects a name and company');
select throws_ok($$ update public.clients set email = 'other@example.test' where id = '00000000-0000-4000-8000-00000000e501' $$,
  '42501', null, 'but not the email the client is known by');

-- Activity
select lives_ok($$ insert into public.client_activity (client_id, kind, note, occurred_at, created_by)
  values ('00000000-0000-4000-8000-00000000e501', 'manual', 'Called about a second machine', now() - interval '2 days', '00000000-0000-4000-8000-0000000005a1') $$,
  'an admin records activity');
select ok((select last_active_at > now() - interval '3 days' from public.clients where id = '00000000-0000-4000-8000-00000000e501'),
  'it moves the last active date forward');
select throws_ok($$ insert into public.client_activity (client_id, kind, inquiry_id, created_by)
  values ('00000000-0000-4000-8000-00000000e501', 'inquiry', '00000000-0000-4000-8000-00000000f501', '00000000-0000-4000-8000-0000000005a1') $$,
  '42501', null, 'an admin cannot record an inquiry by hand');
select throws_ok($$ insert into public.client_activity (client_id, kind, created_by)
  values ('00000000-0000-4000-8000-00000000e501', 'manual', '00000000-0000-4000-8000-0000000005b2') $$,
  '42501', null, 'nor record activity in someone else''s name');
select throws_ok($$ insert into public.client_activity (client_id, kind, created_by)
  values ('00000000-0000-4000-8000-00000000e501', 'inquiry', '00000000-0000-4000-8000-0000000005a1') $$,
  '42501', null, 'only recorded activity can be added by hand');
select throws_ok($$ insert into public.client_activity (client_id, kind, occurred_at, created_by)
  values ('00000000-0000-4000-8000-00000000e501', 'manual', now() + interval '3 days', '00000000-0000-4000-8000-0000000005a1') $$,
  '23514', null, 'activity cannot be dated in the future');
select throws_ok($$ insert into public.client_activity (client_id, kind, occurred_at, created_by)
  values ('00000000-0000-4000-8000-00000000e501', 'manual', now() + interval '1 hour', '00000000-0000-4000-8000-0000000005a1') $$,
  '23514', null, 'not even later today');
select throws_ok($$ insert into public.client_activity (client_id, kind, occurred_at, created_at, created_by)
  values ('00000000-0000-4000-8000-00000000e501', 'manual', now() + interval '3 days', now() + interval '4 days', '00000000-0000-4000-8000-0000000005a1') $$,
  '42501', null, 'the time it was recorded is not the admin''s to set');
select lives_ok($$ insert into public.client_activity (client_id, kind, occurred_at, created_by)
  values ('00000000-0000-4000-8000-00000000e501', 'manual', now() - interval '2 days', '00000000-0000-4000-8000-0000000005a1') $$,
  'an admin records activity from earlier');
select throws_ok($$ insert into public.client_activity (client_id, kind, note, created_by)
  values ('00000000-0000-4000-8000-00000000e501', 'manual', E'Two\nlines', '00000000-0000-4000-8000-0000000005a1') $$,
  '23514', null, 'a note is one line');
select lives_ok($$ delete from public.client_activity where kind = 'manual' and client_id = '00000000-0000-4000-8000-00000000e501' $$,
  'an admin removes recorded activity');
select ok((select last_active_at < now() - interval '39 days' from public.clients where id = '00000000-0000-4000-8000-00000000e501'),
  'and the last active date falls back to the activity that is left');
select is((select count(*)::int from public.client_activity where kind = 'inquiry' and client_id = '00000000-0000-4000-8000-00000000e501'), 1,
  'the inquiry''s own activity is kept');
delete from public.client_activity where kind = 'inquiry';
select is((select count(*)::int from public.client_activity where kind = 'inquiry' and client_id = '00000000-0000-4000-8000-00000000e501'), 1,
  'an admin cannot remove the activity an inquiry made');

-- ---------------------------------------------------------------------------------------------------------------
-- As someone signed in but not on the allowlist
-- ---------------------------------------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000005b2", "role": "authenticated"}', true);
select is((select count(*)::int from public.inquiries), 0, 'a signed-in user who is not an admin sees no inquiries');
select is((select count(*)::int from public.clients), 0, 'and no clients');
select is((select count(*)::int from public.client_activity), 0, 'and no activity');
update public.inquiries set status = 'replied';
update public.clients set marketing_opt_in = false, name = 'Taken over';
reset role;
select is((select status::text from public.inquiries where id = '00000000-0000-4000-8000-00000000f501'), 'new', 'nor change an inquiry');
select is((select name from public.clients where id = '00000000-0000-4000-8000-00000000e501'), 'Dana Whitfield', 'nor a client');

-- ---------------------------------------------------------------------------------------------------------------
-- The contact form can still opt a client back in
-- ---------------------------------------------------------------------------------------------------------------
set local role service_role;
select is(public.submit_inquiry(jsonb_build_object('submission_id', gen_random_uuid(), 'name', 'Dana', 'email', 'dana@example.test',
  'interest', 'Drinks', 'terms_accepted', true, 'marketing_opt_in', true))->>'status', 'ok', 'the client sends another request and ticks the box');
reset role;
select ok((select marketing_opt_in from public.clients where id = '00000000-0000-4000-8000-00000000e501'), 'and is opted in again, by their own choice');
select ok((select last_active_at > now() - interval '1 minute' from public.clients where id = '00000000-0000-4000-8000-00000000e501'),
  'and is active as of now');

-- ---------------------------------------------------------------------------------------------------------------
-- Removing a client removes their inquiries and activity
-- ---------------------------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000005a1", "role": "authenticated"}', true);
select lives_ok($$ delete from public.clients where id = '00000000-0000-4000-8000-00000000e501' $$, 'an admin removes a client');
reset role;
select is((select count(*)::int from public.inquiries where client_id = '00000000-0000-4000-8000-00000000e501'), 0, 'their inquiries go with them');
select is((select count(*)::int from public.client_activity where client_id = '00000000-0000-4000-8000-00000000e501'), 0, 'and their activity');

select * from finish();
rollback;
