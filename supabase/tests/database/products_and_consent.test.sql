-- Product pages (slugs, specs, details) and consent on inquiries. Runs in a transaction that is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into public.categories (id, slug, name, icon, position) values
  ('00000000-0000-4000-8000-00000000c101', 'spec-test', 'Spec test', 'package', 98);

-- ---------------------------------------------------------------------------------------------------------------
-- Slugs
-- ---------------------------------------------------------------------------------------------------------------
insert into public.products (id, category_id, name, sku, visible) values
  ('00000000-0000-4000-8000-00000000d101', '00000000-0000-4000-8000-00000000c101', 'Glass-Front Cooler, 2 Doors!', 'SPEC-1', true),
  ('00000000-0000-4000-8000-00000000d102', '00000000-0000-4000-8000-00000000c101', 'Glass front cooler 2 doors', 'SPEC-2', true),
  ('00000000-0000-4000-8000-00000000d103', '00000000-0000-4000-8000-00000000c101', 'Hidden spec product', 'SPEC-3', false);

select is((select slug from public.products where sku = 'SPEC-1'), 'glass-front-cooler-2-doors', 'a new product gets an address from its name');
select is((select slug from public.products where sku = 'SPEC-2'), 'glass-front-cooler-2-doors-2', 'a repeated address gets a number');
update public.products set name = 'Renamed cooler' where sku = 'SPEC-1';
select is((select slug from public.products where sku = 'SPEC-1'), 'glass-front-cooler-2-doors', 'renaming keeps the address, so shared links keep working');
select throws_ok($$ update public.products set slug = 'Not A Slug' where sku = 'SPEC-1' $$, '23514', null, 'an address must be lowercase words joined by hyphens');
select throws_ok($$ update public.products set slug = 'glass-front-cooler-2-doors-2' where sku = 'SPEC-1' $$, '23505', null, 'two products cannot share an address');
select is(private.slugify('***'), 'product', 'a name with no letters or digits still gets an address');

-- ---------------------------------------------------------------------------------------------------------------
-- Specs
-- ---------------------------------------------------------------------------------------------------------------
select lives_ok($$ update public.products set specs = '[{"label": "Selections", "value": "40"}, {"label": "Power", "value": "115 V"}]' where sku = 'SPEC-1' $$,
  'label and value rows are accepted');
select throws_ok($$ update public.products set specs = '{"label": "Selections", "value": "40"}' where sku = 'SPEC-1' $$, '23514', null, 'specs must be a list');
select throws_ok($$ update public.products set specs = '[{"label": "Selections"}]' where sku = 'SPEC-1' $$, '23514', null, 'a row needs a value');
select throws_ok($$ update public.products set specs = '[{"label": "Selections", "value": 40}]' where sku = 'SPEC-1' $$, '23514', null, 'a value is text');
select throws_ok($$ update public.products set specs = '[{"label": "", "value": "40"}]' where sku = 'SPEC-1' $$, '23514', null, 'a label cannot be blank');
select throws_ok($$ update public.products set specs = '[{"label": "A", "value": "B", "extra": "C"}]' where sku = 'SPEC-1' $$, '23514', null, 'a row has only a label and a value');
select throws_ok($$ update public.products set specs = jsonb_build_array(jsonb_build_object('label', E'Two\nlines', 'value', 'x')) where sku = 'SPEC-1' $$,
  '23514', null, 'labels and values are one line');
select throws_ok($$ update public.products set specs = (select jsonb_agg(jsonb_build_object('label', 'L' || g, 'value', 'v')) from generate_series(1, 31) g) where sku = 'SPEC-1' $$,
  '23514', null, 'at most 30 rows');
select throws_ok($$ update public.products set details = repeat('x', 4001) where sku = 'SPEC-1' $$, '23514', null, 'details stop at 4,000 characters');

-- ---------------------------------------------------------------------------------------------------------------
-- What visitors can read
-- ---------------------------------------------------------------------------------------------------------------
set local role anon;
select throws_ok($$ select sku from public.products $$, '42501', null, 'visitors still cannot read SKUs');
select is((select specs->0->>'value' from public.products where slug = 'glass-front-cooler-2-doors'), '40', 'visitors read a visible product''s specs by its address');
select is((select count(*)::int from public.products where slug = 'hidden-spec-product'), 0, 'a hidden product''s page is not readable');
select throws_ok($$ select consent_text from public.inquiries $$, '42501', null, 'visitors cannot read consent records');
reset role;

-- ---------------------------------------------------------------------------------------------------------------
-- Consent on inquiries
-- ---------------------------------------------------------------------------------------------------------------
set local role service_role;
select is(public.submit_inquiry(jsonb_build_object('submission_id', gen_random_uuid(), 'name', 'n', 'email', 'noterms@example.test', 'interest', 'Drinks'))->>'field',
  'terms', 'a request without agreement to the terms is refused');
select is(public.submit_inquiry(jsonb_build_object('submission_id', gen_random_uuid(), 'name', 'n', 'email', 'noterms@example.test', 'interest', 'Drinks', 'terms_accepted', 'true'))->>'field',
  'terms', 'agreement has to be a real true, not the text "true"');
select is((select count(*)::int from public.inquiries where email = 'noterms@example.test'), 0, 'nothing is saved without agreement');

select is(public.submit_inquiry(jsonb_build_object('submission_id', '00000000-0000-4000-8000-00000000e101', 'name', 'Opted In', 'email', 'optin@example.test',
  'interest', 'Vending machines, Supplements, Drinks, and a much longer list of interests than sixty characters', 'terms_accepted', true, 'marketing_opt_in', true,
  'consent_text', 'I agree to the Terms and the Privacy Policy. Email me about products and offers.'))->>'status', 'ok', 'a request with agreement and opt-in is saved');
select ok((select terms_accepted_at is not null and marketing_opt_in from public.inquiries where submission_id = '00000000-0000-4000-8000-00000000e101'),
  'the inquiry records when the terms were agreed and the opt-in');
select is((select consent_text from public.inquiries where submission_id = '00000000-0000-4000-8000-00000000e101'),
  'I agree to the Terms and the Privacy Policy. Email me about products and offers.', 'the inquiry keeps the wording the visitor agreed to');
select ok((select marketing_opt_in and marketing_opt_in_at is not null from public.clients where email = 'optin@example.test'), 'the client is opted in to marketing email');

select is(public.submit_inquiry(jsonb_build_object('submission_id', gen_random_uuid(), 'name', 'Opted In', 'email', 'optin@example.test', 'interest', 'Drinks',
  'terms_accepted', true))->>'status', 'ok', 'a later request without the box is saved');
select ok((select marketing_opt_in from public.clients where email = 'optin@example.test'), 'leaving the box empty later does not withdraw an earlier opt-in');
select is((select count(*)::int from public.inquiries where email = 'optin@example.test' and not marketing_opt_in), 1, 'that later inquiry records no opt-in of its own');

reset role;
update public.clients set marketing_opt_in_at = '2026-01-01T00:00:00Z' where email = 'optin@example.test';
set local role service_role;
select is(public.submit_inquiry(jsonb_build_object('submission_id', gen_random_uuid(), 'name', 'Opted In', 'email', 'optin@example.test', 'interest', 'Drinks',
  'terms_accepted', true, 'marketing_opt_in', true))->>'status', 'ok', 'a later request that ticks the box again is saved');
select is((select marketing_opt_in_at from public.clients where email = 'optin@example.test'), '2026-01-01T00:00:00Z'::timestamptz,
  'ticking the box again keeps the time the client first said yes');

select is(public.submit_inquiry(jsonb_build_object('submission_id', gen_random_uuid(), 'name', 'n', 'email', 'nooptin@example.test', 'interest', 'Drinks',
  'terms_accepted', true))->>'status', 'ok', 'a request without the marketing box is saved');
select ok((select not marketing_opt_in and marketing_opt_in_at is null from public.clients where email = 'nooptin@example.test'), 'and that client is not opted in');
reset role;

select * from finish();
rollback;
