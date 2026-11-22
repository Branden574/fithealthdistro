-- Fit Health Distribution: core schema.
--
-- Access model
--   anon (public visitors): reads only the published storefront surface: visible products (public columns),
--     categories, live_copy, visible live_faqs and the public business contact columns. Nothing else.
--   authenticated: every row is gated by private.is_admin(). There is no open sign-up; admins are an allowlist.
--   service_role (server only): submits inquiries through public.submit_inquiry() after validation and rate limits,
--     and syncs the copy slots from design-system/site-copy.json.
--
-- Drafts and live content are separate tables. Authoring tables (site_content, faqs) are admin-only. Visitors read
-- live_copy and live_faqs, which change only inside public.publish_site(), in one transaction.

-- ---------------------------------------------------------------------------------------------------------------
-- Schemas and default privileges
-- ---------------------------------------------------------------------------------------------------------------

create schema if not exists private;
comment on schema private is 'Helpers and internal tables. Not exposed through the Data API.';
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- Nothing created from here on in public is reachable by anon or authenticated unless granted below.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public;

-- ---------------------------------------------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------------------------------------------

create type public.stock_status as enum ('in_stock', 'low_stock', 'out_of_stock');
create type public.inquiry_status as enum ('new', 'read', 'replied');
create type public.activity_kind as enum ('inquiry', 'order', 'manual');

-- ---------------------------------------------------------------------------------------------------------------
-- Shared triggers
-- ---------------------------------------------------------------------------------------------------------------

create function private.touch() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Records who changed an authoring row. Service-role writes (seeds, sync) leave it empty.
create function private.touch_by() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Admins (the allowlist)
-- ---------------------------------------------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  name text not null default '' check (char_length(name) <= 80),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);
comment on table public.admins is 'Who may use the admin. Signing in is not enough; the user must be listed here.';
create index admins_created_by_idx on public.admins (created_by);

-- True when the signed-in user is on the allowlist. SECURITY DEFINER so policies on admins itself do not recurse.
create function private.is_admin() returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

-- The admin can never be left without an admin.
create function private.keep_one_admin() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins) then
    raise exception 'At least one admin has to remain.' using errcode = 'P0001';
  end if;
  return null;
end;
$$;
revoke all on function private.keep_one_admin() from public;
create trigger admins_keep_one after delete on public.admins
  for each statement execute function private.keep_one_admin();

-- ---------------------------------------------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 40),
  name text not null check (name = btrim(name) and char_length(name) between 1 and 40),
  icon text not null default 'package' check (icon in ('lockers', 'jar-label', 'drop', 'package', 'barbell', 'pill')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_touch before update on public.categories for each row execute function private.touch();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 120),
  sku text not null unique check (sku ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$'),
  description text not null default '' check (char_length(description) <= 600),
  price_cents integer check (price_cents is null or price_cents between 0 and 100000000),
  price_note text not null default '' check (char_length(price_note) <= 40),
  stock_status public.stock_status not null default 'in_stock',
  visible boolean not null default false,
  image_path text check (image_path is null or image_path ~ '^[0-9a-f-]{36}/[0-9a-z-]{1,64}\.(jpg|png|webp)$'),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.products.visible is 'Show in catalog. Off hides the product from visitors and keeps everything about it.';
comment on column public.products.is_sample is 'Seeded sample. Replace before launch.';
create index products_category_id_idx on public.products (category_id);
create index products_visible_category_idx on public.products (category_id, name) where visible;
create trigger products_touch before update on public.products for each row execute function private.touch();

-- ---------------------------------------------------------------------------------------------------------------
-- Clients and inquiries
-- ---------------------------------------------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  name text not null check (char_length(name) between 1 and 120),
  company text not null default '' check (char_length(company) <= 120),
  phone text not null default '' check (char_length(phone) <= 40),
  first_active_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger clients_touch before update on public.clients for each row execute function private.touch();

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  company text not null default '' check (char_length(company) <= 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null default '' check (char_length(phone) <= 40),
  interest text not null check (char_length(interest) between 1 and 60),
  message text not null default '' check (char_length(message) <= 2000),
  status public.inquiry_status not null default 'new',
  read_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
comment on column public.inquiries.submission_id is 'Generated by the form. A repeated submission returns the first inquiry instead of a duplicate.';
create index inquiries_created_at_idx on public.inquiries (created_at desc);
create index inquiries_status_created_at_idx on public.inquiries (status, created_at desc);
create index inquiries_client_id_idx on public.inquiries (client_id);

-- The products an inquiry mentioned, with their name and SKU kept, so removing a product never loses the record.
create table public.inquiry_products (
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  position smallint not null check (position between 0 and 49),
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  product_sku text not null default '',
  primary key (inquiry_id, position)
);
create index inquiry_products_product_id_idx on public.inquiry_products (product_id);

-- One row each time a client is active: an inquiry now, an order later, or activity the owner records by hand.
create table public.client_activity (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  kind public.activity_kind not null,
  inquiry_id uuid references public.inquiries (id) on delete cascade,
  note text not null default '' check (char_length(note) <= 280),
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (kind <> 'inquiry' or inquiry_id is not null)
);
create index client_activity_client_occurred_idx on public.client_activity (client_id, occurred_at desc);
create index client_activity_occurred_idx on public.client_activity (occurred_at);
create index client_activity_inquiry_id_idx on public.client_activity (inquiry_id);
create index client_activity_created_by_idx on public.client_activity (created_by);

-- ---------------------------------------------------------------------------------------------------------------
-- Site content: authoring (admin only) and live (public)
-- ---------------------------------------------------------------------------------------------------------------

create table public.site_content (
  key text primary key check (key ~ '^[a-z0-9]+(\.[a-z0-9]+)*$'),
  page text not null,
  section text not null,
  label text not null,
  original text not null,
  max_length integer not null check (max_length between 1 and 2000),
  multiline boolean not null default false,
  hint text not null default '',
  sort_order integer not null default 0,
  draft text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint site_content_original_fits check (char_length(original) <= max_length),
  constraint site_content_draft_fits check (char_length(draft) <= max_length)
);
comment on table public.site_content is 'Every storefront text slot. draft is what the owner is editing; visitors never read this table.';
create index site_content_updated_by_idx on public.site_content (updated_by);
create trigger site_content_touch before update of draft on public.site_content for each row execute function private.touch_by();

create table public.live_copy (
  key text primary key references public.site_content (key) on delete cascade,
  text text not null,
  published_at timestamptz not null default now()
);
comment on table public.live_copy is 'The published text of every slot. Changes only through publish_site() and sync_site_copy().';

-- ---------------------------------------------------------------------------------------------------------------
-- FAQs: authoring (admin only) and live (public)
-- ---------------------------------------------------------------------------------------------------------------

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null default '' check (char_length(question) <= 160),
  answer text not null default '' check (char_length(answer) <= 2000),
  position integer not null default 0,
  visible boolean not null default true,
  pending_removal boolean not null default false,
  original_question text check (original_question is null or char_length(original_question) <= 160),
  original_answer text check (original_answer is null or char_length(original_answer) <= 2000),
  is_starter boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
comment on table public.faqs is 'The FAQ being edited: the next version. Every change here is a draft until publish_site().';
comment on column public.faqs.pending_removal is 'Removal staged. The entry stays live until the next publish.';
comment on column public.faqs.is_starter is 'Seeded example. Not approved; never published until the owner writes and publishes an answer.';
create index faqs_position_idx on public.faqs (position, created_at);
create index faqs_updated_by_idx on public.faqs (updated_by);

-- Questions and answers are stored trimmed, with Windows line breaks made plain.
create function private.tidy_faq() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.question := btrim(regexp_replace(new.question, '\s+', ' ', 'g'));
  new.answer := btrim(replace(new.answer, E'\r\n', E'\n'), E' \t\r\n');
  return new;
end;
$$;
create trigger faqs_tidy before insert or update on public.faqs for each row execute function private.tidy_faq();
create trigger faqs_touch before update on public.faqs for each row execute function private.touch_by();

create table public.live_faqs (
  faq_id uuid primary key references public.faqs (id) on delete restrict,
  question text not null check (char_length(question) between 1 and 160),
  answer text not null check (char_length(answer) between 1 and 2000),
  position integer not null,
  visible boolean not null,
  published_at timestamptz not null default now()
);
comment on table public.live_faqs is 'The published FAQ: question, answer, order and visibility as visitors see them.';
create index live_faqs_visible_position_idx on public.live_faqs (position) where visible;

create table public.publications (
  id bigint generated always as identity primary key,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users (id) on delete set null,
  copy_changes integer not null,
  faq_changes integer not null
);
create index publications_published_by_idx on public.publications (published_by);

-- ---------------------------------------------------------------------------------------------------------------
-- Business settings (one row)
-- ---------------------------------------------------------------------------------------------------------------

create table public.business_settings (
  id smallint primary key default 1 check (id = 1),
  public_email text not null default '' check (public_email = '' or public_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  public_phone text not null default '' check (char_length(public_phone) <= 40),
  notify_email text not null default '' check (notify_email = '' or notify_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
comment on column public.business_settings.public_email is 'Shown on the storefront.';
comment on column public.business_settings.notify_email is 'Where new inquiry alerts go. Private.';
create index business_settings_updated_by_idx on public.business_settings (updated_by);
create trigger business_settings_touch before update on public.business_settings for each row execute function private.touch_by();
insert into public.business_settings (id) values (1);

-- ---------------------------------------------------------------------------------------------------------------
-- Rate limits (private)
-- ---------------------------------------------------------------------------------------------------------------

create table private.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);
create index rate_limits_window_start_idx on private.rate_limits (window_start);
alter table private.rate_limits enable row level security;
grant select, insert, update, delete on private.rate_limits to service_role;

-- Counts one hit in the current fixed window and says whether the bucket is still under its limit.
create function private.take_rate_limit(p_bucket text, p_limit integer, p_window interval) returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_seconds double precision := extract(epoch from p_window);
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / v_seconds) * v_seconds);
  v_hits integer;
begin
  delete from private.rate_limits where window_start < now() - interval '2 days';
  insert into private.rate_limits as r (bucket, window_start, hits)
  values (p_bucket, v_start, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;
  return v_hits <= p_limit;
end;
$$;
revoke all on function private.take_rate_limit(text, integer, interval) from public;
grant execute on function private.take_rate_limit(text, integer, interval) to service_role;

-- For server code (sign-in attempts). Service role only.
create function public.take_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer) returns boolean
language sql
set search_path = ''
as $$
  select private.take_rate_limit(p_bucket, p_limit, make_interval(secs => p_window_seconds));
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------------------------------------------

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_products enable row level security;
alter table public.client_activity enable row level security;
alter table public.site_content enable row level security;
alter table public.live_copy enable row level security;
alter table public.faqs enable row level security;
alter table public.live_faqs enable row level security;
alter table public.publications enable row level security;
alter table public.business_settings enable row level security;

-- Public surface
create policy "Visitors see categories" on public.categories for select to anon using (true);
create policy "Visitors see products in the catalog" on public.products for select to anon using (visible);
create policy "Visitors see published copy" on public.live_copy for select to anon, authenticated using (true);
create policy "Visitors see published, visible questions" on public.live_faqs for select to anon using (visible);
create policy "Visitors see public contact details" on public.business_settings for select to anon using (true);

-- Admins
create policy "Admins see admins" on public.admins for select to authenticated using ((select private.is_admin()));
create policy "Admins add admins" on public.admins for insert to authenticated with check ((select private.is_admin()));
create policy "Admins remove admins" on public.admins for delete to authenticated using ((select private.is_admin()));

create policy "Admins manage categories" on public.categories for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins manage products" on public.products for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins manage clients" on public.clients for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins manage inquiries" on public.inquiries for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins see inquiry products" on public.inquiry_products for select to authenticated using ((select private.is_admin()));
create policy "Admins see client activity" on public.client_activity for select to authenticated using ((select private.is_admin()));
create policy "Admins record activity" on public.client_activity for insert to authenticated
  with check ((select private.is_admin()) and kind = 'manual' and created_by = (select auth.uid()));
create policy "Admins remove recorded activity" on public.client_activity for delete to authenticated
  using ((select private.is_admin()) and kind = 'manual');
create policy "Admins edit site content" on public.site_content for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins edit FAQ drafts" on public.faqs for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins see every published question" on public.live_faqs for select to authenticated using ((select private.is_admin()));
create policy "Admins see publications" on public.publications for select to authenticated using ((select private.is_admin()));
create policy "Admins manage settings" on public.business_settings for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------------------------------------------
-- Grants: only what each role needs
-- ---------------------------------------------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- anon: the published read surface, public columns only.
grant select (id, slug, name, icon, position) on public.categories to anon;
grant select (id, category_id, name, description, price_cents, price_note, stock_status, image_path, is_sample) on public.products to anon;
grant select on public.live_copy to anon;
-- visible is granted so the storefront read can filter on it; the policy already limits visitors to visible rows.
grant select (faq_id, question, answer, position, visible) on public.live_faqs to anon;
grant select (public_email, public_phone) on public.business_settings to anon;

-- authenticated: admin work, gated row by row by the policies above.
grant select, insert, delete on public.admins to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, update (name, company, phone), delete on public.clients to authenticated;
grant select, update (status, read_at, replied_at), delete on public.inquiries to authenticated;
grant select on public.inquiry_products to authenticated;
grant select, insert, delete on public.client_activity to authenticated;
grant select, update (draft) on public.site_content to authenticated;
grant select on public.live_copy to authenticated;
grant select, insert, delete, update (question, answer, position, visible, pending_removal) on public.faqs to authenticated;
grant select on public.live_faqs to authenticated;
grant select on public.publications to authenticated;
grant select, update (public_email, public_phone, notify_email) on public.business_settings to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- Reading: one statement each, so a reader sees one consistent snapshot
-- ---------------------------------------------------------------------------------------------------------------

-- What visitors see: published copy and the published, visible FAQ, in order.
create function public.get_storefront_content() returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'copy', coalesce((select jsonb_object_agg(c.key, c.text) from public.live_copy c), '{}'::jsonb),
    'faqs', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.faq_id, 'question', f.question, 'answer', f.answer) order by f.position)
      from public.live_faqs f
      where f.visible
    ), '[]'::jsonb)
  );
$$;

-- What the storefront would show after Publish. Admins only.
create function public.get_draft_content() returns jsonb
language plpgsql
stable
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can preview drafts.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'copy', coalesce((select jsonb_object_agg(s.key, s.draft) from public.site_content s), '{}'::jsonb),
    'faqs', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'question', f.question, 'answer', f.answer) order by f.position, f.created_at, f.id)
      from public.faqs f
      where f.visible and not f.pending_removal and f.question <> '' and f.answer <> ''
    ), '[]'::jsonb)
  );
end;
$$;

-- Editors' views: each draft beside what visitors see now.
create view public.site_content_editor with (security_invoker = true) as
select
  s.key, s.page, s.section, s.label, s.original, s.max_length, s.multiline, s.hint, s.sort_order, s.draft,
  coalesce(l.text, s.original) as published,
  s.draft is distinct from coalesce(l.text, s.original) as unpublished,
  coalesce(l.text, s.original) is distinct from s.original as edited,
  s.updated_at
from public.site_content s
left join public.live_copy l on l.key = s.key;

create view public.faq_editor with (security_invoker = true) as
select
  f.id, f.question, f.answer, f.position, f.visible, f.pending_removal,
  f.original_question, f.original_answer, f.is_starter,
  f.question <> '' and f.answer <> '' as complete,
  l.faq_id is not null as is_published,
  l.question as published_question,
  l.answer as published_answer,
  l.position as published_position,
  l.visible as published_visible,
  l.published_at,
  case
    when f.pending_removal then 'removal'
    when l.faq_id is null then 'draft'
    when (f.question, f.answer, f.visible) is distinct from (l.question, l.answer, l.visible) then 'changed'
    else 'published'
  end as status,
  f.created_at, f.updated_at
from public.faqs f
left join public.live_faqs l on l.faq_id = f.id;

revoke all on public.site_content_editor, public.faq_editor from anon, authenticated;
grant select on public.site_content_editor, public.faq_editor to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- Writing
-- ---------------------------------------------------------------------------------------------------------------

-- Sets the draft order of the FAQ from a list of ids. The live order changes only when published.
create function public.reorder_faqs(p_ids uuid[]) returns void
language plpgsql
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can reorder questions.' using errcode = '42501';
  end if;
  update public.faqs f
  set position = x.ord
  from unnest(p_ids) with ordinality as x(id, ord)
  where f.id = x.id and f.position is distinct from x.ord;
end;
$$;

-- Publishes every saved draft, copy and FAQ together, in one transaction. Visitors see the old snapshot or the new
-- one, never a mix. A failure changes nothing and keeps every draft.
--   Copy: every slot's draft becomes live.
--   FAQ: staged removals leave; every complete entry (question and answer) goes live with its order and visibility.
--        A new entry that is not complete stays a draft. A published entry whose draft is not complete blocks publishing.
-- SECURITY DEFINER because visitors' tables accept no direct writes; it checks the caller is an admin first.
create function public.publish_site() returns public.publications
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_copy integer;
  v_removed integer;
  v_faqs integer;
  v_publication public.publications;
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can publish.' using errcode = '42501';
  end if;

  -- One publish at a time.
  perform pg_advisory_xact_lock(hashtext('fhd.publish_site'));

  if exists (
    select 1 from public.faqs f
    join public.live_faqs l on l.faq_id = f.id
    where not f.pending_removal and (f.question = '' or f.answer = '')
  ) then
    raise exception 'A published question needs a question and an answer. Fill both in, or restore the published wording, then publish again.'
      using errcode = '23514';
  end if;

  with changed as (
    insert into public.live_copy as l (key, text, published_at)
    select s.key, s.draft, now() from public.site_content s
    on conflict (key) do update set text = excluded.text, published_at = excluded.published_at
      where l.text is distinct from excluded.text
    returning 1
  )
  select count(*) into v_copy from changed;

  with removed as (
    delete from public.live_faqs l
    using public.faqs f
    where f.id = l.faq_id and f.pending_removal
    returning 1
  )
  select count(*) into v_removed from removed;
  delete from public.faqs where pending_removal;

  with ranked as (
    select f.id, f.question, f.answer, f.visible,
      (row_number() over (order by f.position, f.created_at, f.id))::integer as rank
    from public.faqs f
    where f.question <> '' and f.answer <> ''
  ),
  upserted as (
    insert into public.live_faqs as l (faq_id, question, answer, position, visible, published_at)
    select r.id, r.question, r.answer, r.rank, r.visible, now() from ranked r
    on conflict (faq_id) do update
      set question = excluded.question, answer = excluded.answer, position = excluded.position,
          visible = excluded.visible, published_at = excluded.published_at
      where (l.question, l.answer, l.position, l.visible)
        is distinct from (excluded.question, excluded.answer, excluded.position, excluded.visible)
    returning 1
  )
  select count(*) into v_faqs from upserted;

  insert into public.publications (published_by, copy_changes, faq_changes)
  values ((select auth.uid()), v_copy, v_removed + v_faqs)
  returning * into v_publication;
  return v_publication;
end;
$$;

-- Loads the copy slots from design-system/site-copy.json. Adds new slots with their original wording live, updates
-- labels, limits and originals of existing ones, and never touches a draft or the published text. Service role only.
create function public.sync_site_copy(p_slots jsonb) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.site_content as s (key, page, section, label, original, max_length, multiline, hint, sort_order, draft)
  select
    t.slot->>'key', t.slot->>'page', t.slot->>'section', t.slot->>'label', t.slot->>'text',
    (t.slot->>'max')::integer, coalesce((t.slot->>'multiline')::boolean, false), coalesce(t.slot->>'hint', ''),
    t.ord::integer, t.slot->>'text'
  from jsonb_array_elements(p_slots) with ordinality as t(slot, ord)
  on conflict (key) do update
    set page = excluded.page, section = excluded.section, label = excluded.label, original = excluded.original,
        max_length = excluded.max_length, multiline = excluded.multiline, hint = excluded.hint, sort_order = excluded.sort_order;
  get diagnostics v_count = row_count;

  insert into public.live_copy (key, text)
  select s.key, s.original from public.site_content s
  on conflict (key) do nothing;
  return v_count;
end;
$$;

-- Records a contact form submission. Called by the server after it has validated the form and checked the honeypot.
-- Applies the rate limits, links or creates the client, keeps a snapshot of each product mentioned, and logs activity.
-- Returns {"status":"ok","id":...} or {"status":"rate_limited"}. A repeated submission_id returns the first inquiry.
-- Service role only: visitors cannot reach it or the tables directly.
create function public.submit_inquiry(p jsonb) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_submission uuid := (p->>'submission_id')::uuid;
  v_email text := lower(btrim(p->>'email'));
  v_client uuid;
  v_inquiry uuid;
begin
  select i.id into v_inquiry from public.inquiries i where i.submission_id = v_submission;
  if found then
    return jsonb_build_object('status', 'ok', 'id', v_inquiry, 'duplicate', true);
  end if;

  if not private.take_rate_limit('inquiry:ip:' || coalesce(p->>'ip_hash', 'unknown'), 5, interval '1 hour')
     or not private.take_rate_limit('inquiry:email:' || md5(v_email), 3, interval '10 minutes') then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  insert into public.clients as c (email, name, company, phone)
  values (v_email, btrim(p->>'name'), coalesce(btrim(p->>'company'), ''), coalesce(btrim(p->>'phone'), ''))
  on conflict (email) do update
    set name = excluded.name,
        company = case when excluded.company <> '' then excluded.company else c.company end,
        phone = case when excluded.phone <> '' then excluded.phone else c.phone end,
        last_active_at = now()
  returning c.id into v_client;

  insert into public.inquiries (submission_id, client_id, name, company, email, phone, interest, message)
  values (
    v_submission, v_client, btrim(p->>'name'), coalesce(btrim(p->>'company'), ''), v_email,
    coalesce(btrim(p->>'phone'), ''), btrim(p->>'interest'), coalesce(btrim(p->>'message'), '')
  )
  returning id into v_inquiry;

  insert into public.inquiry_products (inquiry_id, position, product_id, product_name, product_sku)
  select v_inquiry, (row_number() over (order by x.ord) - 1)::smallint, pr.id, pr.name, pr.sku
  from (
    select distinct on (e.value) e.value, e.ord
    from jsonb_array_elements_text(coalesce(p->'product_ids', '[]'::jsonb)) with ordinality as e(value, ord)
    where e.value ~ '^[0-9a-f-]{36}$'
    order by e.value, e.ord
  ) x
  join public.products pr on pr.id = x.value::uuid and pr.visible
  order by x.ord
  limit 50;

  insert into public.client_activity (client_id, kind, inquiry_id) values (v_client, 'inquiry', v_inquiry);
  return jsonb_build_object('status', 'ok', 'id', v_inquiry);
end;
$$;

-- Function access: nothing is callable unless granted here.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_storefront_content() to anon, authenticated;
grant execute on function public.get_draft_content() to authenticated;
grant execute on function public.reorder_faqs(uuid[]) to authenticated;
grant execute on function public.publish_site() to authenticated;
grant execute on function public.sync_site_copy(jsonb) to service_role;
grant execute on function public.submit_inquiry(jsonb) to service_role;
grant execute on function public.take_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- Storage: product photos. Public read by URL, admin write, images up to 5 MB.
-- ---------------------------------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- No select policy for visitors: files are served by public URL, and the bucket cannot be listed.
create policy "Admins see product photos" on storage.objects for select to authenticated
  using (bucket_id = 'product-photos' and (select private.is_admin()));
create policy "Admins upload product photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-photos' and (select private.is_admin()));
create policy "Admins replace product photos" on storage.objects for update to authenticated
  using (bucket_id = 'product-photos' and (select private.is_admin()))
  with check (bucket_id = 'product-photos' and (select private.is_admin()));
create policy "Admins remove product photos" on storage.objects for delete to authenticated
  using (bucket_id = 'product-photos' and (select private.is_admin()));
