-- Where inquiries come from: what the contact form keeps, and the dashboard's count by source. The clock is pinned to
-- June 2031 so nothing else in the database falls inside the periods measured. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000008a1', 'src-owner@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000008b2', 'src-someone@example.test', 'authenticated', 'authenticated');
insert into public.admins (user_id, email, name) values ('00000000-0000-4000-8000-0000000008a1', 'src-owner@example.test', 'Owner');

-- ---------------------------------------------------------------------------------------------------------------
-- What submit_inquiry keeps
-- ---------------------------------------------------------------------------------------------------------------
set local role service_role;
select is(public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', '00000000-0000-4000-8000-00000000f001',
  'name', 'Tagged', 'email', 'src-tagged@example.test', 'interest', 'Drinks', 'ip_hash', 'src-ip-1',
  'source', jsonb_build_object('referrer_host', 'facebook.com', 'utm_source', 'Flyer', 'utm_medium', 'Print',
    'utm_campaign', 'Spring <b>Gym</b> 2031', 'landing_path', '/products/combo-machine')))->>'status', 'ok',
  'an inquiry with a source is recorded');
select is((select row(referrer_host, utm_source, utm_medium, utm_campaign, landing_path)::text from public.inquiries
  where submission_id = '00000000-0000-4000-8000-00000000f001'),
  '(facebook.com,flyer,print,"spring b gym b 2031",/products/combo-machine)',
  'tags are lower-cased, and each run of anything but letters, digits and _ . + - becomes one space');

select is(public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', '00000000-0000-4000-8000-00000000f002',
  'name', 'Odd', 'email', 'src-odd@example.test', 'interest', 'Drinks', 'ip_hash', 'src-ip-2',
  'source', jsonb_build_object('referrer_host', 'https://evil.example/path', 'utm_source', repeat('a', 500),
    'landing_path', E'/x y\n', 'extra', 'ignored')))->>'status', 'ok',
  'a source that does not fit never stops the inquiry');
select is((select row(referrer_host, char_length(utm_source), landing_path)::text from public.inquiries
  where submission_id = '00000000-0000-4000-8000-00000000f002'), '("",100,"")',
  'a host that is not a host name and a path with spaces are left out; a long tag is cut to 100');

select is(public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', '00000000-0000-4000-8000-00000000f003',
  'name', 'Plain', 'email', 'src-plain@example.test', 'interest', 'Drinks', 'ip_hash', 'src-ip-3', 'source', 'not an object'))->>'status', 'ok',
  'a source that is not an object is ignored');
select is((select row(referrer_host, utm_source, utm_medium, utm_campaign, landing_path)::text from public.inquiries
  where submission_id = '00000000-0000-4000-8000-00000000f003'), '("","","","","")', 'and leaves every part empty');

select is(public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', '00000000-0000-4000-8000-00000000f004',
  'name', 'None', 'email', 'src-none@example.test', 'interest', 'Drinks', 'ip_hash', 'src-ip-4'))->>'status', 'ok',
  'an inquiry without a source is recorded as before');
reset role;

select throws_ok($$ insert into public.inquiries (submission_id, client_id, name, email, interest, referrer_host)
  select gen_random_uuid(), client_id, 'x', 'x@example.test', 'x', 'not a host!' from public.inquiries limit 1 $$,
  '23514', null, 'the table refuses a referrer that is not a host name');
select throws_ok($$ insert into public.inquiries (submission_id, client_id, name, email, interest, utm_source)
  select gen_random_uuid(), client_id, 'x', 'x@example.test', 'x', 'Capitals' from public.inquiries limit 1 $$,
  '23514', null, 'and a tag that was not cleaned');
select throws_ok($$ insert into public.inquiries (submission_id, client_id, name, email, interest, landing_path)
  select gen_random_uuid(), client_id, 'x', 'x@example.test', 'x', 'https://elsewhere.example/' from public.inquiries limit 1 $$,
  '23514', null, 'and a landing page that is not a path on this site');

-- ---------------------------------------------------------------------------------------------------------------
-- Who may read the count, and what it says. Inquiries placed in June 2031 in Chicago.
-- ---------------------------------------------------------------------------------------------------------------
insert into public.clients (id, email, name) values
  ('00000000-0000-4000-8000-00000000d0a1', 'src-a@example.test', 'Client A'),
  ('00000000-0000-4000-8000-00000000d0b2', 'src-b@example.test', 'Client B'),
  ('00000000-0000-4000-8000-00000000d0c3', 'src-c@example.test', 'Client C');
insert into public.inquiries (submission_id, client_id, name, email, interest, created_at, utm_source, utm_medium, utm_campaign, referrer_host) values
  (gen_random_uuid(), '00000000-0000-4000-8000-00000000d0a1', 'A', 'src-a@example.test', 'x', '2031-06-01 10:00 America/Chicago', 'flyer', 'print', 'spring', ''),
  (gen_random_uuid(), '00000000-0000-4000-8000-00000000d0b2', 'B', 'src-b@example.test', 'x', '2031-06-10 10:00 America/Chicago', 'flyer', 'print', 'spring', ''),
  (gen_random_uuid(), '00000000-0000-4000-8000-00000000d0c3', 'C', 'src-c@example.test', 'x', '2031-06-12 10:00 America/Chicago', '', '', '', 'google.com'),
  (gen_random_uuid(), '00000000-0000-4000-8000-00000000d0c3', 'C', 'src-c@example.test', 'x', '2031-04-01 10:00 America/Chicago', '', '', '', '');
-- A ordered the day of their inquiry; C ordered before their June inquiry, which does not count, but after April's.
insert into public.client_activity (client_id, kind, occurred_at, created_at, amount) values
  ('00000000-0000-4000-8000-00000000d0a1', 'order', '2031-06-01 15:00 America/Chicago', '2031-06-01 15:00 America/Chicago', 100),
  ('00000000-0000-4000-8000-00000000d0c3', 'order', '2031-05-01 12:00 America/Chicago', '2031-05-01 12:00 America/Chicago', 50);

set local role anon;
select throws_ok($$ select public.inquiry_sources('UTC') $$, '42501', null, 'visitors cannot read where inquiries come from');
select throws_ok($$ select referrer_host from public.inquiries $$, '42501', null, 'nor read the source columns');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000008b2", "role": "authenticated"}', true);
select throws_ok($$ select public.inquiry_sources('UTC') $$, '42501', null, 'nor can a signed-in non-admin');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000008a1", "role": "authenticated"}', true);
create temporary table sources as select public.inquiry_sources('America/Chicago', '2031-06-15 12:00 America/Chicago') as s;

select is((select s->>'today' from sources), '2031-06-15', 'today is the admin''s calendar day');
select is((select jsonb_agg((p->>'days')::int order by (p->>'days')::int) from sources, jsonb_array_elements(s->'periods') p),
  '[30, 60, 90]'::jsonb, 'three periods');
select is((select s->'periods'->0->'sources' from sources),
  '[{"utmSource": "flyer", "utmMedium": "print", "utmCampaign": "spring", "referrerHost": "", "inquiries": 2, "converted": 1},
    {"utmSource": "", "utmMedium": "", "utmCampaign": "", "referrerHost": "google.com", "inquiries": 1, "converted": 0}]'::jsonb,
  '30 days: the flyer brought two, one ordered; Google brought one that ordered only before');
select is((select x from sources, jsonb_array_elements(s->'periods'->2->'sources') x where x->>'referrerHost' = '' and x->>'utmSource' = ''),
  '{"utmSource": "", "utmMedium": "", "utmCampaign": "", "referrerHost": "", "inquiries": 1, "converted": 1}'::jsonb,
  '90 days: April''s inquiry with no source converted with May''s order');
select is((select public.inquiry_sources('Mars/Olympus', '2031-07-01 03:00+00')->>'today'), '2031-07-01', 'an unknown zone falls back to UTC');
select is((select referrer_host from public.inquiries where submission_id = '00000000-0000-4000-8000-00000000f001'), 'facebook.com',
  'an admin reads the source columns');
reset role;

select * from finish();
rollback;
