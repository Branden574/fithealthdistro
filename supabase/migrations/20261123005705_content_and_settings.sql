-- Stage 6: editing site content and settings in the admin.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. Page copy: a save is one statement, so every edit in it lands or none does. It runs with the admin's own rights:
--    RLS, the column grant on draft, and each slot's length and not-blank checks all apply.
-- ---------------------------------------------------------------------------------------------------------------
create function public.save_copy_drafts(p_drafts jsonb) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can edit site content.' using errcode = '42501';
  end if;
  if p_drafts is null or jsonb_typeof(p_drafts) <> 'object' then
    raise exception 'Drafts come as an object of slot key to text.' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_each(p_drafts) x where jsonb_typeof(x.value) <> 'string') then
    raise exception 'Every draft is text.' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_object_keys(p_drafts) k where not exists (select 1 from public.site_content s where s.key = k)) then
    raise exception 'A slot in this save does not exist.' using errcode = '22023';
  end if;

  update public.site_content s
  set draft = x.value
  from jsonb_each_text(p_drafts) as x(key, value)
  where s.key = x.key and s.draft is distinct from x.value;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.save_copy_drafts(jsonb) from public, anon;
grant execute on function public.save_copy_drafts(jsonb) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Adding an admin: the server finds an existing account by email before it creates one. Service role only; the
--    server checks the caller is an admin first, and the admins table checks it again on insert.
-- ---------------------------------------------------------------------------------------------------------------
create function public.find_user_id(p_email text) returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from auth.users u where lower(u.email) = lower(btrim(p_email)) limit 1;
$$;
revoke all on function public.find_user_id(text) from public, anon, authenticated;
grant execute on function public.find_user_id(text) to service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- 3. An admin's name can be corrected in Settings. Nothing else about an admin row changes after it is added.
-- ---------------------------------------------------------------------------------------------------------------
grant update (name) on public.admins to authenticated;
create policy "Admins rename admins" on public.admins for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter table public.admins add constraint admins_name_fits check (char_length(name) <= 80 and name !~ '[[:cntrl:]]');

-- ---------------------------------------------------------------------------------------------------------------
-- The starter FAQ questions were seeded without their originals, so Restore original had nothing to put back. Fills
-- them in for the six seeded rows, by id and with the seeded wording, only where none is recorded. On a fresh database
-- this matches nothing: the seed runs after the migrations and records them itself.
-- ---------------------------------------------------------------------------------------------------------------

update public.faqs f
set original_question = s.question, original_answer = ''
from (values
  ('9f2b6c1d-0001-4000-8000-000000000001'::uuid, 'Which areas do you deliver to?'),
  ('9f2b6c1d-0002-4000-8000-000000000002'::uuid, 'Do you install the machines?'),
  ('9f2b6c1d-0003-4000-8000-000000000003'::uuid, 'What warranty comes with a machine?'),
  ('9f2b6c1d-0004-4000-8000-000000000004'::uuid, 'How long does delivery take?'),
  ('9f2b6c1d-0005-4000-8000-000000000005'::uuid, 'Can I return a product?'),
  ('9f2b6c1d-0006-4000-8000-000000000006'::uuid, 'Do you offer financing?')
) as s (id, question)
where f.id = s.id and f.is_starter and f.original_question is null;
