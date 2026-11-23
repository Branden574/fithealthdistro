-- Orders with amounts, and the dashboard's numbers. The clock is pinned to June 2031 so nothing else in the database
-- falls inside the periods measured. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000007a1', 'dash-owner@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000007b2', 'dash-someone@example.test', 'authenticated', 'authenticated');
insert into public.admins (user_id, email, name) values ('00000000-0000-4000-8000-0000000007a1', 'dash-owner@example.test', 'Owner');

insert into public.clients (id, email, name) values
  ('00000000-0000-4000-8000-00000000c0a1', 'dash-a@example.test', 'Client A'),
  ('00000000-0000-4000-8000-00000000c0b2', 'dash-b@example.test', 'Client B'),
  ('00000000-0000-4000-8000-00000000c0c3', 'dash-c@example.test', 'Client C'),
  ('00000000-0000-4000-8000-00000000c0d4', 'dash-d@example.test', 'Client D');

-- Activity as the table owner, recorded when it happened. Times are Chicago's.
create temporary table fixture_activity (client char(1), kind public.activity_kind, at timestamptz, amount numeric);
insert into fixture_activity values
  ('a', 'manual', '2031-02-10 12:00 America/Chicago', null),
  ('a', 'manual', '2031-05-12 12:00 America/Chicago', null),
  ('a', 'order',  '2031-06-01 09:00 America/Chicago', 1000),
  ('b', 'manual', '2031-03-03 12:00 America/Chicago', null),
  ('c', 'manual', '2031-01-20 12:00 America/Chicago', null),
  ('c', 'order',  '2031-04-20 12:00 America/Chicago', 400),
  ('c', 'manual', '2031-06-02 12:00 America/Chicago', null),
  ('d', 'manual', '2031-05-05 12:00 America/Chicago', null),
  ('d', 'order',  '2031-06-05 12:00 America/Chicago', 250.50);
insert into public.client_activity (client_id, kind, occurred_at, created_at, amount)
select ('00000000-0000-4000-8000-00000000c0' || f.client || (case f.client when 'a' then '1' when 'b' then '2' when 'c' then '3' else '4' end))::uuid,
  f.kind, f.at, f.at, f.amount
from fixture_activity f;

insert into public.inquiries (submission_id, client_id, name, email, interest, status, created_at) values
  (gen_random_uuid(), '00000000-0000-4000-8000-00000000c0a1', 'Client A', 'dash-a@example.test', 'Vending machines', 'read', '2031-06-01 10:00 America/Chicago'),
  (gen_random_uuid(), '00000000-0000-4000-8000-00000000c0b2', 'Client B', 'dash-b@example.test', 'Drinks', 'new', '2031-06-10 10:00 America/Chicago'),
  (gen_random_uuid(), '00000000-0000-4000-8000-00000000c0c3', 'Client C', 'dash-c@example.test', 'Supplements', 'new', '2031-06-12 10:00 America/Chicago'),
  (gen_random_uuid(), '00000000-0000-4000-8000-00000000c0d4', 'Client D', 'dash-d@example.test', 'Drinks', 'replied', '2031-05-01 10:00 America/Chicago');

-- ---------------------------------------------------------------------------------------------------------------
-- Who may read the numbers, and record orders
-- ---------------------------------------------------------------------------------------------------------------
set local role anon;
select throws_ok($$ select public.dashboard_stats('UTC') $$, '42501', null, 'visitors cannot read the dashboard');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000007b2", "role": "authenticated"}', true);
select throws_ok($$ select public.dashboard_stats('UTC') $$, '42501', null, 'nor can a signed-in non-admin');
select throws_ok($$
  insert into public.client_activity (client_id, kind, amount, created_by)
  values ('00000000-0000-4000-8000-00000000c0a1', 'order', 10, '00000000-0000-4000-8000-0000000007b2')
$$, '42501', null, 'a non-admin cannot record an order');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000007a1", "role": "authenticated"}', true);
select lives_ok($$
  insert into public.client_activity (client_id, kind, amount, note, created_by)
  values ('00000000-0000-4000-8000-00000000c0a1', 'order', 1250.75, 'Two combo machines', '00000000-0000-4000-8000-0000000007a1')
$$, 'an admin records an order with its total');
select throws_ok($$
  insert into public.client_activity (client_id, kind, created_by)
  values ('00000000-0000-4000-8000-00000000c0a1', 'order', '00000000-0000-4000-8000-0000000007a1')
$$, '23514', null, 'an order needs a total');
select throws_ok($$
  insert into public.client_activity (client_id, kind, amount, created_by)
  values ('00000000-0000-4000-8000-00000000c0a1', 'manual', 20, '00000000-0000-4000-8000-0000000007a1')
$$, '23514', null, 'other activity has no total');
select throws_ok($$
  insert into public.client_activity (client_id, kind, amount, created_by)
  values ('00000000-0000-4000-8000-00000000c0a1', 'order', 0, '00000000-0000-4000-8000-0000000007a1')
$$, '23514', null, 'a total is more than nothing');
select throws_ok($$
  insert into public.client_activity (client_id, kind, amount, created_by)
  values ('00000000-0000-4000-8000-00000000c0a1', 'order', 10000000.01, '00000000-0000-4000-8000-0000000007a1')
$$, '23514', null, 'and at most ten million dollars');
select throws_ok($$
  insert into public.client_activity (client_id, kind, created_by)
  values ('00000000-0000-4000-8000-00000000c0a1', 'inquiry', '00000000-0000-4000-8000-0000000007a1')
$$, '42501', null, 'inquiries stay the contact form''s own');
delete from public.client_activity where note = 'Two combo machines';
select is((select count(*)::int from public.client_activity where note = 'Two combo machines'), 0, 'an admin removes an order they recorded by mistake');

-- ---------------------------------------------------------------------------------------------------------------
-- The numbers, as an admin in Chicago on 15 June 2031
-- ---------------------------------------------------------------------------------------------------------------
create temporary table stats as select public.dashboard_stats('America/Chicago', '2031-06-15 12:00 America/Chicago') as s;

select is((select s->>'today' from stats), '2031-06-15', 'today is the admin''s calendar day');
select is((select jsonb_array_length(s->'months') from stats), 12, 'twelve months of retention');
select is((select s->'months'->11->>'month' from stats), '2031-06-01', 'ending with this month');

-- June: active Jan to Mar were A, B and C; A and C are active again Apr to Jun, as is D, who is new.
select is((select (s->'months'->11) - 'month' from stats), '{"previous": 3, "returned": 2, "active": 3}'::jsonb,
  'June: two of the three clients from January to March came back');
-- May: active Dec to Feb were A and C; both are active again Mar to May (A by hand, C by an order). B and D are new.
select is((select (s->'months'->10) - 'month' from stats), '{"previous": 2, "returned": 2, "active": 4}'::jsonb,
  'May: an order counts as activity');
-- December 2030: nobody was active June to August 2030, so there is nothing to measure.
select is((select (s->'months'->5->>'previous')::int from stats), 0, 'a month with no earlier clients has nothing to measure');
select is((select s->'months'->5->>'month' from stats), '2030-12-01', 'that month is December 2030');

-- Inquiries: 10 and 12 June are within the last 7 days; nothing came in the 7 before.
select is((select (s->'inquiries'->>'recent')::int from stats), 2, 'two inquiries in the last 7 days');
select is((select (s->'inquiries'->>'previous')::int from stats), 0, 'none in the 7 days before');
select is((select (s->'inquiries'->>'unread')::int from stats), (select count(*)::int from public.inquiries where status = 'new'), 'unread counts every new inquiry');
select is((select (s->'products'->>'live')::int from stats), (select count(*)::int from public.products where visible), 'products live are the visible ones');
select is((select (s->'products'->>'hidden')::int from stats), (select count(*)::int from public.products where not visible), 'and the rest are hidden');

-- Last 30 days (17 May to 15 June): A's order of 1,000 and D's of 250.50. The 30 days before hold C's 400.
select is((select (s->'periods'->0) - 'slices' from stats),
  '{"days": 30, "sales": 1250.50, "orders": 2, "previousSales": 400.00, "previousOrders": 1, "inquiries": 3, "converted": 1, "previousInquiries": 1, "previousConverted": 1}'::jsonb,
  '30 days: sales, orders, and conversion beside the 30 days before');
-- A's order came the morning of the day A's inquiry did, so it counts; C's order came before C's inquiry, so it does not.
-- D's inquiry is from 1 May and converted with the order on 5 June, which is counted although it is later.
select is((select (s->'periods'->1) - 'slices' from stats),
  '{"days": 60, "sales": 1650.50, "orders": 3, "previousSales": 0, "previousOrders": 0, "inquiries": 4, "converted": 2, "previousInquiries": 0, "previousConverted": 0}'::jsonb,
  '60 days: everything since 17 April');
select is((select jsonb_array_length(s->'periods'->0->'slices') from stats), 6, 'each period has six slices');
select is((select s->'periods'->0->'slices'->3 from stats), '{"end": "2031-06-05", "sales": 1250.50}'::jsonb,
  'the slice from 1 to 5 June holds both orders');
select is((select s->'periods'->0->'slices'->0->>'end' from stats), '2031-05-21', 'the first 30-day slice ends on 21 May');
select is((select s->'periods'->2->'slices'->5->>'end' from stats), '2031-06-15', 'the last slice ends today');
select is(
  (select sum((x->>'sales')::numeric) from stats, jsonb_array_elements(s->'periods'->2->'slices') x),
  (select (s->'periods'->2->>'sales')::numeric from stats),
  'the 90-day slices add up to the 90-day total'
);

-- Days follow the admin's time zone, and a zone the database does not know falls back to UTC.
select is((select public.dashboard_stats('America/Chicago', '2031-07-01 03:00+00')->>'today'), '2031-06-30', 'late evening in Chicago is still the 30th');
select is((select public.dashboard_stats('UTC', '2031-07-01 03:00+00')->>'today'), '2031-07-01', 'while in UTC it is the 1st');
select is((select public.dashboard_stats('Mars/Olympus', '2031-07-01 03:00+00')->>'timeZone'), 'UTC', 'an unknown zone falls back to UTC');
reset role;

select * from finish();
rollback;
