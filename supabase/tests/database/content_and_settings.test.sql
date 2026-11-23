-- Saving page copy, finding accounts for new admins, and renaming admins. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000006a1', 'content-owner@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000006b2', 'Content-Someone@Example.test', 'authenticated', 'authenticated');
insert into public.admins (user_id, email, name) values ('00000000-0000-4000-8000-0000000006a1', 'content-owner@example.test', 'Owner');
insert into public.site_content (key, page, section, label, original, max_length, optional, draft) values
  ('test6.headline', 'Home', 'Hero', 'Headline', 'Stock what moves.', 28, false, 'Stock what moves.'),
  ('test6.highlight', 'Home', 'Hero', 'Highlight', 'moves.', 14, true, 'moves.')
on conflict (key) do nothing;
insert into public.live_copy (key, text) values ('test6.headline', 'Stock what moves.'), ('test6.highlight', 'moves.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------------------------------------------
-- Who may save
-- ---------------------------------------------------------------------------------------------------------------
set local role anon;
select throws_ok($$ select public.save_copy_drafts('{"test6.headline": "Hacked"}') $$, '42501', null, 'visitors cannot save copy');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000006b2", "role": "authenticated"}', true);
select throws_ok($$ select public.save_copy_drafts('{"test6.headline": "Hacked"}') $$, '42501', null, 'nor can a signed-in non-admin');
select throws_ok($$ select public.find_user_id('content-owner@example.test') $$, '42501', null, 'signed-in users cannot look up accounts');
update public.admins set name = 'Me' where user_id = '00000000-0000-4000-8000-0000000006a1';
reset role;
select is((select name from public.admins where user_id = '00000000-0000-4000-8000-0000000006a1'), 'Owner', 'a non-admin cannot rename admins');

-- ---------------------------------------------------------------------------------------------------------------
-- Saving, as an admin
-- ---------------------------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000006a1", "role": "authenticated"}', true);
select is(public.save_copy_drafts('{"test6.headline": "Fuel what moves.", "test6.highlight": ""}'), 2, 'an admin saves two drafts at once');
select is((select draft from public.site_content where key = 'test6.headline'), 'Fuel what moves.', 'the draft holds the new text');
select is((select draft from public.site_content where key = 'test6.highlight'), '', 'an optional slot may be saved empty');
select is((select text from public.live_copy where key = 'test6.headline'), 'Stock what moves.', 'visitors still see the published text');
select is(public.save_copy_drafts('{"test6.headline": "Fuel what moves."}'), 0, 'saving the same text again changes nothing');
select throws_ok($$ select public.save_copy_drafts('{"test6.headline": "Short", "test6.highlight": "far too long for this slot"}') $$,
  '23514', null, 'a draft past its limit is refused');
select is((select draft from public.site_content where key = 'test6.headline'), 'Fuel what moves.', 'and the rest of that save is not kept either');
select throws_ok($$ select public.save_copy_drafts('{"test6.headline": "   "}') $$, '23514', null, 'a required slot cannot be blank');
select throws_ok($$ select public.save_copy_drafts('{"test6.nope": "Text"}') $$, '22023', null, 'a slot that does not exist is refused');
select throws_ok($$ select public.save_copy_drafts('{"test6.headline": 5}') $$, '22023', null, 'a draft is text');
select throws_ok($$ select public.save_copy_drafts('["test6.headline"]') $$, '22023', null, 'drafts come as an object');
select throws_ok($$ update public.site_content set original = 'Changed' where key = 'test6.headline' $$, '42501', null,
  'the original wording is not the admin''s to change');

-- Renaming admins
select lives_ok($$ update public.admins set name = 'Ryan' where user_id = '00000000-0000-4000-8000-0000000006a1' $$, 'an admin renames an admin');
select throws_ok($$ update public.admins set name = E'Two\nlines' where user_id = '00000000-0000-4000-8000-0000000006a1' $$, '23514', null,
  'a name is one line');
select throws_ok($$ update public.admins set email = 'other@example.test' where user_id = '00000000-0000-4000-8000-0000000006a1' $$, '42501', null,
  'an admin''s email comes from their account, not from an edit');
reset role;

-- ---------------------------------------------------------------------------------------------------------------
-- Finding accounts, as the server
-- ---------------------------------------------------------------------------------------------------------------
set local role service_role;
select is(public.find_user_id(' content-someone@example.TEST '), '00000000-0000-4000-8000-0000000006b2'::uuid, 'the server finds an account by email, any case');
select is(public.find_user_id('nobody@example.test'), null, 'and nothing for an email with no account');
reset role;

-- ---------------------------------------------------------------------------------------------------------------
-- Starter FAQ examples
-- ---------------------------------------------------------------------------------------------------------------
select is(
  (select count(*)::int from public.faqs where is_starter and updated_by is null and (original_question is distinct from question or original_answer is distinct from '')),
  0,
  'each starter example records its seeded wording as the original, for Restore original'
);
select is(
  (select count(*)::int from public.faqs where is_starter and updated_by is null and answer <> ''),
  0,
  'and none comes with an answer, so none can be published as is'
);

select * from finish();
rollback;
