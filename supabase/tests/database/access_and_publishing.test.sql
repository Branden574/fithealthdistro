-- Access rules and the draft/publish lifecycle, tested as a visitor (anon), a signed-in non-admin, the service role
-- and an admin. Runs in a transaction that is rolled back. Run with: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- ---------------------------------------------------------------------------------------------------------------
-- Function access and the last-admin guard, before any fixtures
-- ---------------------------------------------------------------------------------------------------------------
select is_empty($$
  select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private') and has_function_privilege('anon', p.oid, 'execute')
    and p.oid::regprocedure::text <> 'get_storefront_content()'
$$, 'visitors can execute only the storefront read');
select is_empty($$
  select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private') and has_function_privilege('authenticated', p.oid, 'execute')
    and p.oid::regprocedure::text not in ('get_storefront_content()', 'get_draft_content()', 'reorder_faqs(uuid[])',
      'publish_site()', 'save_copy_drafts(jsonb)', 'private.is_admin()', 'private.publish_site()', 'private.slugify(text)', 'private.valid_specs(jsonb)')
$$, 'signed-in users can execute only the admin allowlist');
select lives_ok($$ delete from public.admins where user_id = '00000000-0000-4000-8000-000000000000' $$,
  'deleting nothing never trips the last-admin guard, even with an empty allowlist');

-- ---------------------------------------------------------------------------------------------------------------
-- Fixtures, as the table owner
-- ---------------------------------------------------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'owner@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'someone@example.test', 'authenticated', 'authenticated');
insert into public.admins (user_id, email, name) values ('00000000-0000-4000-8000-0000000000a1', 'owner@example.test', 'Owner');

insert into public.categories (id, slug, name, icon, position) values
  ('00000000-0000-4000-8000-00000000c001', 'test-category', 'Test category', 'package', 99);
insert into public.products (id, category_id, name, sku, visible, price_cents) values
  ('00000000-0000-4000-8000-00000000d001', '00000000-0000-4000-8000-00000000c001', 'Visible test product', 'TEST-1', true, 100),
  ('00000000-0000-4000-8000-00000000d002', '00000000-0000-4000-8000-00000000c001', 'Hidden test product', 'TEST-2', false, 200);

insert into public.site_content (key, page, section, label, original, max_length, draft) values
  ('test.headline', 'Home', 'Hero', 'Headline', 'Stock what moves.', 28, 'Stock what moves.')
on conflict (key) do nothing;
insert into public.live_copy (key, text) values ('test.headline', 'Stock what moves.') on conflict (key) do nothing;

delete from public.faqs where id not in (select faq_id from public.live_faqs);
insert into public.faqs (id, question, answer, position, visible) values
  ('00000000-0000-4000-8000-0000000000f1', 'Q one', 'A one', 1, true),
  ('00000000-0000-4000-8000-0000000000f2', 'Q two', 'A two', 2, false);
insert into public.live_faqs (faq_id, question, answer, position, visible) values
  ('00000000-0000-4000-8000-0000000000f1', 'Q one', 'A one', 1, true),
  ('00000000-0000-4000-8000-0000000000f2', 'Q two', 'A two', 2, false);

update public.business_settings set public_email = 'hello@example.test', notify_email = 'alerts@example.test';

-- ---------------------------------------------------------------------------------------------------------------
-- Service role: the only way an inquiry gets in
-- ---------------------------------------------------------------------------------------------------------------
set local role service_role;
select is(
  public.submit_inquiry(jsonb_build_object('terms_accepted', true, 
    'submission_id', '00000000-0000-4000-8000-00000000e001', 'name', ' Dana Whitfield ', 'company', 'Northside',
    'email', ' Dana@Example.test ', 'phone', '', 'interest', 'Vending machines', 'message', 'Two machines, please.',
    'ip_hash', 'ip-a',
    'product_ids', jsonb_build_array('00000000-0000-4000-8000-00000000d001', '00000000-0000-4000-8000-00000000d002', 'not-a-uuid')
  ))->>'status', 'ok', 'the service role records an inquiry');
select is((select count(*)::int from public.inquiry_products ip join public.inquiries i on i.id = ip.inquiry_id
           where i.submission_id = '00000000-0000-4000-8000-00000000e001'), 1,
  'only visible products are attached to an inquiry');
select is((select email from public.clients where email = 'dana@example.test'), 'dana@example.test', 'the client is created with a normalized email');
select is(
  public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', '00000000-0000-4000-8000-00000000e001', 'name', 'x', 'email', 'x@example.test', 'interest', 'x'))->>'duplicate',
  'true', 'a repeated submission returns the first inquiry');
select is((select count(*)::int from public.inquiries where submission_id = '00000000-0000-4000-8000-00000000e001'), 1, 'and creates no duplicate');
select is((select count(*)::int from public.client_activity a join public.clients c on c.id = a.client_id where c.email = 'dana@example.test'), 1,
  'an inquiry is logged as client activity');
-- Rate limit: five an hour from one address.
select is(public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', gen_random_uuid(), 'name', 'n', 'email', 'r' || g || '@example.test', 'interest', 'Drinks', 'ip_hash', 'ip-b'))->>'status', 'ok',
  'submission ' || g || ' from one address is accepted') from generate_series(1, 5) g;
select is(public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', gen_random_uuid(), 'name', 'n', 'email', 'r6@example.test', 'interest', 'Drinks', 'ip_hash', 'ip-b'))->>'status',
  'rate_limited', 'the sixth submission from one address in an hour is refused');
select is(
  public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', gen_random_uuid(), 'name', 'Someone Else', 'company', 'Other Co',
    'email', 'DANA@example.test' || chr(8203), 'phone', '555-0100', 'interest', 'Drinks', 'ip_hash', 'ip-c'))->>'status', 'ok',
  'a second inquiry from the same address, with an invisible character in it, is accepted');
select is((select count(*)::int from public.clients where email like 'dana@%'), 1, 'invisible characters do not create a second client');
select is((select name || ' / ' || company from public.clients where email = 'dana@example.test'), 'Dana Whitfield / Northside',
  'an unverified form cannot change a known client''s name or company');
select is((select phone from public.clients where email = 'dana@example.test'), '555-0100', 'it only fills details that were blank');
select is((select name from public.inquiries where email = 'dana@example.test' order by created_at desc, name limit 1) in ('Someone Else', 'Dana Whitfield'), true,
  'what was typed is kept on the inquiry');
select is(public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', gen_random_uuid(), 'name', 'n', 'email', 'not-an-email', 'interest', 'Drinks', 'ip_hash', 'ip-d'))->>'status',
  'invalid', 'an address without an email shape is refused');
select is(public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', gen_random_uuid(), 'name', E'Line\r\nInjected', 'email', 'lines@example.test', 'interest', E'Drinks\nX', 'ip_hash', 'ip-e',
  'product_ids', jsonb_build_array(repeat('-', 36), 'ABCDEF00-0000-4000-8000-000000000000')))->>'status', 'ok',
  'malformed product ids are skipped instead of failing the inquiry');
select is((select name || '|' || interest from public.inquiries where email = 'lines@example.test'), 'Line Injected|Drinks X',
  'line breaks are folded out of single-line fields');
select is(public.submit_inquiry(jsonb_build_object('terms_accepted', true, 'submission_id', gen_random_uuid(), 'name', 'n', 'email', 'noip@example.test', 'interest', 'Drinks'))->>'status', 'ok',
  'a submission without an address hash is not lumped into a shared bucket');
reset role;

-- ---------------------------------------------------------------------------------------------------------------
-- Visitor (anon): the published surface and nothing else
-- ---------------------------------------------------------------------------------------------------------------
set local role anon;
select throws_ok('select * from public.faqs', '42501', null, 'visitors cannot read FAQ drafts');
select throws_ok('select * from public.site_content', '42501', null, 'visitors cannot read copy drafts');
select throws_ok('select * from public.faq_editor', '42501', null, 'visitors cannot read the FAQ editor view');
select throws_ok('select * from public.site_content_editor', '42501', null, 'visitors cannot read the copy editor view');
select throws_ok('select * from public.inquiries', '42501', null, 'visitors cannot read inquiries');
select throws_ok('select * from public.inquiry_products', '42501', null, 'visitors cannot read inquiry products');
select throws_ok('select * from public.clients', '42501', null, 'visitors cannot read clients');
select throws_ok('select * from public.client_activity', '42501', null, 'visitors cannot read client activity');
select throws_ok('select * from public.admins', '42501', null, 'visitors cannot read admins');
select throws_ok('select * from public.publications', '42501', null, 'visitors cannot read publications');
select throws_ok('select * from private.rate_limits', '42501', null, 'visitors cannot reach the private schema');
select throws_ok('select sku from public.products', '42501', null, 'visitors cannot read internal product columns');
select throws_ok('select notify_email from public.business_settings', '42501', null, 'visitors cannot read private settings');
select is((select public_email from public.business_settings), 'hello@example.test', 'visitors can read the public email');
select results_eq(
  $$ select name from public.products where category_id = '00000000-0000-4000-8000-00000000c001' $$,
  $$ values ('Visible test product'::text) $$,
  'visitors see visible products only');
select results_eq($$ select faq_id from public.live_faqs $$, $$ values ('00000000-0000-4000-8000-0000000000f1'::uuid) $$,
  'visitors see published, visible questions only');
select is(public.get_storefront_content()->'faqs',
  '[{"id": "00000000-0000-4000-8000-0000000000f1", "question": "Q one", "answer": "A one"}]'::jsonb,
  'the storefront read returns only published, visible questions');
select is(public.get_storefront_content()->'copy'->>'test.headline', 'Stock what moves.', 'the storefront read returns published copy');
select throws_ok($$ insert into public.inquiries (submission_id, client_id, name, email, interest) values (gen_random_uuid(), gen_random_uuid(), 'x', 'x@x.x', 'x') $$,
  '42501', null, 'visitors cannot insert inquiries directly');
select throws_ok($$ select public.submit_inquiry('{}'::jsonb) $$, '42501', null, 'visitors cannot call the inquiry function');
select throws_ok($$ select public.publish_site() $$, '42501', null, 'visitors cannot publish');
select throws_ok($$ select public.get_draft_content() $$, '42501', null, 'visitors cannot preview drafts');
select throws_ok($$ select public.sync_site_copy('[]'::jsonb) $$, '42501', null, 'visitors cannot sync copy');
select throws_ok($$ select public.take_rate_limit('x', 1, 60) $$, '42501', null, 'visitors cannot touch rate limits');
select throws_ok($$ update public.live_copy set text = 'x' $$, '42501', null, 'visitors cannot change live copy');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('product-photos', 'x/y.png') $$, '42501', null,
  'visitors cannot upload product photos');
reset role;

-- ---------------------------------------------------------------------------------------------------------------
-- Signed in but not on the allowlist
-- ---------------------------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000b2", "role": "authenticated"}', true);
select is_empty('select * from public.inquiries', 'a non-admin sees no inquiries');
select is_empty('select * from public.clients', 'a non-admin sees no clients');
select is_empty('select * from public.faqs', 'a non-admin sees no FAQ drafts');
select is_empty('select * from public.admins', 'a non-admin sees no admins');
select is_empty($$ update public.faqs set question = 'x' returning id $$, 'a non-admin cannot edit FAQ drafts');
select is_empty($$ update public.products set visible = true returning id $$, 'a non-admin cannot change products');
select throws_ok($$ select public.publish_site() $$, '42501', 'Only admins can publish.', 'a non-admin cannot publish');
select throws_ok($$ select public.get_draft_content() $$, '42501', null, 'a non-admin cannot preview drafts');
select throws_ok($$ insert into public.admins (user_id, email) values ('00000000-0000-4000-8000-0000000000b2', 'someone@example.test') $$,
  '42501', null, 'a non-admin cannot add themselves as an admin');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('product-photos', 'x/y.png') $$, '42501', null,
  'a non-admin cannot upload product photos');
reset role;

-- ---------------------------------------------------------------------------------------------------------------
-- Admin: drafts stay drafts until Publish
-- ---------------------------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated"}', true);
select isnt_empty('select * from public.inquiries', 'an admin sees inquiries');
select isnt_empty('select * from public.clients', 'an admin sees clients');

update public.site_content set draft = 'Fuel what moves.' where key = 'test.headline';
update public.faqs set answer = 'A one, edited' where id = '00000000-0000-4000-8000-0000000000f1';
insert into public.faqs (id, question, answer, position, visible) values
  ('00000000-0000-4000-8000-0000000000f3', '  Q   three  ', E'  Para one.\r\n\r\nPara two.  \n', 0, true),
  ('00000000-0000-4000-8000-0000000000f4', 'Q four', '', 3, true);
update public.faqs set pending_removal = true where id = '00000000-0000-4000-8000-0000000000f2';

select is((select question from public.faqs where id = '00000000-0000-4000-8000-0000000000f3'), 'Q three', 'questions are trimmed and spaces collapsed');
select is((select answer from public.faqs where id = '00000000-0000-4000-8000-0000000000f3'), E'Para one.\n\nPara two.', 'answers are trimmed and keep paragraph breaks');
select is((select updated_by from public.faqs where id = '00000000-0000-4000-8000-0000000000f1'), '00000000-0000-4000-8000-0000000000a1'::uuid, 'edits record who made them');

select is((select text from public.live_copy where key = 'test.headline'), 'Stock what moves.', 'a saved copy draft leaves the live text alone');
select is(public.get_storefront_content()->'faqs',
  '[{"id": "00000000-0000-4000-8000-0000000000f1", "question": "Q one", "answer": "A one"}]'::jsonb,
  'saved FAQ drafts, additions and staged removals leave the live FAQ alone');
select is((select status from public.faq_editor where id = '00000000-0000-4000-8000-0000000000f1'), 'changed', 'an edited published entry shows unpublished changes');
select is((select status from public.faq_editor where id = '00000000-0000-4000-8000-0000000000f2'), 'removal', 'a staged removal shows as such');
select is((select status from public.faq_editor where id = '00000000-0000-4000-8000-0000000000f3'), 'draft', 'a new entry is a draft');
select is((select complete from public.faq_editor where id = '00000000-0000-4000-8000-0000000000f4'), false, 'an entry without an answer is not complete');
select is((select unpublished from public.site_content_editor where key = 'test.headline'), true, 'the copy editor marks the slot unpublished');

select is(
  (select jsonb_agg(x->>'id') from jsonb_array_elements(public.get_draft_content()->'faqs') x),
  '["00000000-0000-4000-8000-0000000000f3", "00000000-0000-4000-8000-0000000000f1"]'::jsonb,
  'the preview shows the proposed FAQ: additions, edits and order in, removals and incomplete entries out');
select is(public.get_draft_content()->'copy'->>'test.headline', 'Fuel what moves.', 'the preview shows draft copy');

select throws_ok($$ insert into public.live_faqs (faq_id, question, answer, position, visible) values ('00000000-0000-4000-8000-0000000000f3', 'x', 'y', 1, true) $$,
  '42501', null, 'admins cannot write the live FAQ directly');
select throws_ok($$ update public.live_copy set text = 'x' $$, '42501', null, 'admins cannot write live copy directly');

select lives_ok($$ select public.publish_site() $$, 'an admin can publish');
select is((select text from public.live_copy where key = 'test.headline'), 'Fuel what moves.', 'publishing updates the live copy');
select is(
  (select jsonb_agg(x->>'id') from jsonb_array_elements(public.get_storefront_content()->'faqs') x),
  '["00000000-0000-4000-8000-0000000000f3", "00000000-0000-4000-8000-0000000000f1"]'::jsonb,
  'publishing updates the live FAQ in the same step, in the new order');
select ok(not exists (select 1 from public.faqs where id = '00000000-0000-4000-8000-0000000000f2'), 'a staged removal is applied on publish');
select ok(not exists (select 1 from public.live_faqs where faq_id = '00000000-0000-4000-8000-0000000000f4'), 'an incomplete new entry stays a draft');
select is((select copy_changes from public.publications order by id desc limit 1), 1, 'the publication counts copy changes');

update public.faqs set visible = false where id = '00000000-0000-4000-8000-0000000000f3';
select is(jsonb_array_length(public.get_storefront_content()->'faqs'), 2, 'hiding a question is a draft until published');
select public.reorder_faqs(array['00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000f3', '00000000-0000-4000-8000-0000000000f4']::uuid[]);
select is((select faq_id from public.live_faqs order by position limit 1), '00000000-0000-4000-8000-0000000000f3'::uuid, 'reordering is a draft until published');
select is((select position from public.faqs where id = '00000000-0000-4000-8000-0000000000f1'), 1, 'reordering sets the draft order');

update public.faqs set answer = '' where id = '00000000-0000-4000-8000-0000000000f1';
select throws_ok($$ select public.publish_site() $$, '23514', null, 'a published question left without an answer blocks publishing');
select is((select answer from public.live_faqs where faq_id = '00000000-0000-4000-8000-0000000000f1'), 'A one, edited', 'a failed publish keeps the live content');
select is((select answer from public.faqs where id = '00000000-0000-4000-8000-0000000000f1'), '', 'a failed publish keeps the draft');
select is((select visible from public.live_faqs where faq_id = '00000000-0000-4000-8000-0000000000f3'), true, 'a failed publish applies nothing');

select throws_ok($$ update public.site_content set draft = repeat('x', 29) where key = 'test.headline' $$, '23514', null, 'a copy draft cannot pass its limit');
select throws_ok($$ insert into public.faqs (question, answer) values (repeat('q', 161), 'a') $$, '23514', null, 'a question cannot pass 160 characters');
select throws_ok($$ insert into public.faqs (question, answer) values ('q', repeat('a', 2001)) $$, '23514', null, 'an answer cannot pass 2,000 characters');
select throws_ok($$ update public.inquiries set email = 'x@example.test' $$, '42501', null, 'admins change only an inquiry''s status');
select throws_ok($$ update public.site_content set original = 'x' $$, '42501', null, 'admins cannot change a slot''s original wording');
select throws_ok($$ delete from public.admins $$, 'P0001', null, 'the last admin cannot be removed');
select lives_ok($$ insert into public.client_activity (client_id, kind, created_by) select id, 'manual', '00000000-0000-4000-8000-0000000000a1' from public.clients limit 1 $$,
  'an admin can record activity by hand');
select throws_ok($$ insert into public.client_activity (client_id, kind, inquiry_id, created_by) select c.id, 'inquiry', i.id, '00000000-0000-4000-8000-0000000000a1' from public.clients c join public.inquiries i on i.client_id = c.id limit 1 $$,
  '42501', null, 'an admin cannot fake inquiry activity');
select throws_ok($$ update public.site_content set draft = '   ' where key = 'test.headline' $$, '23514', null, 'a copy slot cannot be saved blank');
select throws_ok($$ insert into public.faqs (question, answer, is_starter) values ('q', 'a', true) $$, '42501', null, 'admins cannot mark entries as starters');
select throws_ok($$ insert into public.faqs (question, answer, updated_by) values ('q', 'a', '00000000-0000-4000-8000-0000000000b2') $$, '42501', null,
  'admins cannot forge who wrote an entry');
select lives_ok($$ insert into public.admins (user_id, name) values ('00000000-0000-4000-8000-0000000000b2', 'Helper') $$, 'an admin can add an admin');
select is((select email || ' ' || created_by::text from public.admins where user_id = '00000000-0000-4000-8000-0000000000b2'),
  'someone@example.test 00000000-0000-4000-8000-0000000000a1', 'the new admin''s email and who added them come from the database');
select throws_ok($$ insert into public.admins (user_id, email) values ('00000000-0000-4000-8000-0000000000b2', 'spoof@example.test') $$, '42501', null,
  'admins cannot type an admin''s email');
reset role;
insert into public.site_content (key, page, section, label, original, max_length, optional, draft) values ('test.optional', 'Home', 'Hero', 'Optional', 'x', 10, true, '');
select is((select draft from public.site_content where key = 'test.optional'), '', 'a slot marked optional may be empty');

select * from finish();
rollback;
