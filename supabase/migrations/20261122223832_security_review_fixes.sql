-- Fixes from the Stage 2 security review.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. New functions are not executable by everyone.
--    Per-schema default privileges cannot remove Postgres' built-in EXECUTE for PUBLIC; only a global default can.
-- ---------------------------------------------------------------------------------------------------------------
alter default privileges for role postgres revoke execute on functions from public;
revoke execute on function private.touch(), private.touch_by(), private.tidy_faq() from public;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. The last-admin guard: only when rows were actually removed, and serialized so two removals at once cannot
--    both pass and empty the allowlist.
-- ---------------------------------------------------------------------------------------------------------------
drop trigger admins_keep_one on public.admins;
create or replace function private.keep_one_admin() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from removed) then
    return null;
  end if;
  perform pg_advisory_xact_lock(hashtext('fhd.admins'));
  if not exists (select 1 from public.admins) then
    raise exception 'At least one admin has to remain.' using errcode = 'P0001';
  end if;
  return null;
end;
$$;
revoke all on function private.keep_one_admin() from public;
create trigger admins_keep_one after delete on public.admins
  referencing old table as removed
  for each statement execute function private.keep_one_admin();

-- ---------------------------------------------------------------------------------------------------------------
-- 3. Admins set only what they should: inserts are limited to the editable columns, and the audit columns are
--    filled by the database.
-- ---------------------------------------------------------------------------------------------------------------
revoke insert on public.faqs, public.admins from authenticated;
grant insert (id, question, answer, position, visible) on public.faqs to authenticated;
grant insert (user_id, name) on public.admins to authenticated;

drop trigger faqs_touch on public.faqs;
create trigger faqs_touch before insert or update on public.faqs for each row execute function private.touch_by();

-- An admin row's email always comes from the auth user, and created_by from whoever added it.
create function private.fill_admin() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select lower(u.email) into new.email from auth.users u where u.id = new.user_id;
  if new.email is null then
    raise exception 'That user does not exist.' using errcode = '23503';
  end if;
  new.created_by := coalesce((select auth.uid()), new.created_by);
  new.created_at := now();
  return new;
end;
$$;
revoke all on function private.fill_admin() from public;
create trigger admins_fill before insert on public.admins for each row execute function private.fill_admin();

-- ---------------------------------------------------------------------------------------------------------------
-- 4. Contact details on inquiries and clients: one line, no control characters, a real email shape.
-- ---------------------------------------------------------------------------------------------------------------
alter table public.clients
  add constraint clients_email_shape check (email ~ '^[^@[:space:][:cntrl:]]+@[^@[:space:][:cntrl:]]+\.[^@[:space:][:cntrl:]]+$'),
  add constraint clients_single_line check (name !~ '[[:cntrl:]]' and company !~ '[[:cntrl:]]' and phone !~ '[[:cntrl:]]');
alter table public.inquiries
  add constraint inquiries_email_shape check (email ~ '^[^@[:space:][:cntrl:]]+@[^@[:space:][:cntrl:]]+\.[^@[:space:][:cntrl:]]+$'),
  add constraint inquiries_single_line check (
    name !~ '[[:cntrl:]]' and company !~ '[[:cntrl:]]' and phone !~ '[[:cntrl:]]' and interest !~ '[[:cntrl:]]'
  );

-- ---------------------------------------------------------------------------------------------------------------
-- 5. submit_inquiry
--    - An unverified form can no longer change a known client's name, company or phone. It only fills blanks;
--      what was typed is kept on the inquiry itself.
--    - Emails are normalized (invisible and control characters removed) and must have an email shape.
--    - Single-line fields have control characters folded to spaces.
--    - Product ids must be real UUIDs; at most the first 50 are read.
--    - Without an address hash the per-address limit is skipped, not shared; a site-wide cap backs it up, and the
--      per-email limit ignores +tags.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.submit_inquiry(p jsonb) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_submission uuid := (p->>'submission_id')::uuid;
  v_email text := lower(regexp_replace(coalesce(p->>'email', ''), '[[:space:][:cntrl:]' || chr(160) || chr(8203) || chr(8204) || chr(8205) || chr(65279) || ']', '', 'g'));
  v_name text := btrim(regexp_replace(coalesce(p->>'name', ''), '[[:cntrl:]]+', ' ', 'g'));
  v_company text := btrim(regexp_replace(coalesce(p->>'company', ''), '[[:cntrl:]]+', ' ', 'g'));
  v_phone text := btrim(regexp_replace(coalesce(p->>'phone', ''), '[[:cntrl:]]+', ' ', 'g'));
  v_interest text := btrim(regexp_replace(coalesce(p->>'interest', ''), '[[:cntrl:]]+', ' ', 'g'));
  v_ip text := nullif(btrim(coalesce(p->>'ip_hash', '')), '');
  v_client uuid;
  v_inquiry uuid;
begin
  select i.id into v_inquiry from public.inquiries i where i.submission_id = v_submission;
  if found then
    return jsonb_build_object('status', 'ok', 'id', v_inquiry, 'duplicate', true);
  end if;

  if v_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    return jsonb_build_object('status', 'invalid', 'field', 'email');
  end if;

  if (v_ip is not null and not private.take_rate_limit('inquiry:ip:' || v_ip, 5, interval '1 hour'))
     or not private.take_rate_limit('inquiry:email:' || md5(regexp_replace(v_email, '\+[^@]*@', '@')), 3, interval '10 minutes')
     or not private.take_rate_limit('inquiry:all', 200, interval '1 hour') then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  insert into public.clients as c (email, name, company, phone)
  values (v_email, v_name, v_company, v_phone)
  on conflict (email) do update
    set company = case when c.company = '' then excluded.company else c.company end,
        phone = case when c.phone = '' then excluded.phone else c.phone end,
        last_active_at = now()
  returning c.id into v_client;

  insert into public.inquiries (submission_id, client_id, name, company, email, phone, interest, message)
  values (v_submission, v_client, v_name, v_company, v_email, v_phone, v_interest, coalesce(btrim(p->>'message'), ''))
  returning id into v_inquiry;

  insert into public.inquiry_products (inquiry_id, position, product_id, product_name, product_sku)
  select v_inquiry, (row_number() over (order by x.ord) - 1)::smallint, pr.id, pr.name, pr.sku
  from (
    select distinct on (lower(e.value)) lower(e.value) as value, e.ord
    from jsonb_array_elements_text(
      case when jsonb_typeof(p->'product_ids') = 'array' then p->'product_ids' else '[]'::jsonb end
    ) with ordinality as e(value, ord)
    where e.ord <= 50 and e.value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    order by lower(e.value), e.ord
  ) x
  join public.products pr on pr.id = x.value::uuid and pr.visible
  order by x.ord;

  insert into public.client_activity (client_id, kind, inquiry_id) values (v_client, 'inquiry', v_inquiry);
  return jsonb_build_object('status', 'ok', 'id', v_inquiry);
end;
$$;
revoke all on function public.submit_inquiry(jsonb) from public, anon, authenticated;
grant execute on function public.submit_inquiry(jsonb) to service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- 6. Copy slots cannot be published blank, unless the slot says it may be empty (the hero highlight).
--    Syncing removes slots that are no longer in site-copy.json.
-- ---------------------------------------------------------------------------------------------------------------
alter table public.site_content add column optional boolean not null default false;
alter table public.site_content add constraint site_content_draft_not_blank check (optional or btrim(draft) <> '');

create or replace function public.sync_site_copy(p_slots jsonb) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.site_content as s (key, page, section, label, original, max_length, multiline, hint, optional, sort_order, draft)
  select
    t.slot->>'key', t.slot->>'page', t.slot->>'section', t.slot->>'label', t.slot->>'text',
    (t.slot->>'max')::integer, coalesce((t.slot->>'multiline')::boolean, false), coalesce(t.slot->>'hint', ''),
    coalesce((t.slot->>'optional')::boolean, false), t.ord::integer, t.slot->>'text'
  from jsonb_array_elements(p_slots) with ordinality as t(slot, ord)
  on conflict (key) do update
    set page = excluded.page, section = excluded.section, label = excluded.label, original = excluded.original,
        max_length = excluded.max_length, multiline = excluded.multiline, hint = excluded.hint,
        optional = excluded.optional, sort_order = excluded.sort_order;
  get diagnostics v_count = row_count;

  delete from public.site_content s
  where not exists (select 1 from jsonb_array_elements(p_slots) t(slot) where t.slot->>'key' = s.key);

  insert into public.live_copy (key, text)
  select s.key, s.original from public.site_content s
  on conflict (key) do nothing;
  return v_count;
end;
$$;
revoke all on function public.sync_site_copy(jsonb) from public, anon, authenticated;
grant execute on function public.sync_site_copy(jsonb) to service_role;

drop view public.site_content_editor;
create view public.site_content_editor with (security_invoker = true) as
select
  s.key, s.page, s.section, s.label, s.original, s.max_length, s.multiline, s.optional, s.hint, s.sort_order, s.draft,
  coalesce(l.text, s.original) as published,
  s.draft is distinct from coalesce(l.text, s.original) as unpublished,
  coalesce(l.text, s.original) is distinct from s.original as edited,
  s.updated_at
from public.site_content s
left join public.live_copy l on l.key = s.key;
revoke all on public.site_content_editor from anon, authenticated;
grant select on public.site_content_editor to authenticated;
