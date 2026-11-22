-- Product pages, product specs, and consent on the contact form.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. Products: an address for each product's page, a longer description for that page, and spec rows.
-- ---------------------------------------------------------------------------------------------------------------

-- "Combo vending machine, 40 selections" -> "combo-vending-machine-40-selections".
create function private.slugify(p_text text) returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(nullif(btrim(left(btrim(regexp_replace(lower(coalesce(p_text, '')), '[^a-z0-9]+', '-', 'g'), '-'), 72), '-'), ''), 'product');
$$;
revoke all on function private.slugify(text) from public;
-- Pure and data-free. Admins need it: the slug trigger runs as whoever adds the product.
grant execute on function private.slugify(text) to authenticated, service_role;

-- Spec rows: [{ "label": "Selections", "value": "40" }, ...]. Labels up to 40 characters, values up to 200, at most 30 rows.
create function private.valid_specs(p_specs jsonb) returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(p_specs) is distinct from 'array' then false
    when jsonb_array_length(p_specs) > 30 then false
    else not exists (
      select 1 from jsonb_array_elements(p_specs) as e(row)
      where jsonb_typeof(e.row) is distinct from 'object'
         or (select count(*) from jsonb_object_keys(case when jsonb_typeof(e.row) = 'object' then e.row else '{}'::jsonb end)) <> 2
         or jsonb_typeof(e.row->'label') is distinct from 'string'
         or jsonb_typeof(e.row->'value') is distinct from 'string'
         or char_length(btrim(e.row->>'label')) not between 1 and 40
         or char_length(btrim(e.row->>'value')) not between 1 and 200
         or e.row->>'label' ~ '[[:cntrl:]]'
         or e.row->>'value' ~ '[[:cntrl:]]'
    )
  end;
$$;
revoke all on function private.valid_specs(jsonb) from public;
-- Pure and data-free. Admins need it: the check runs as whoever writes the product.
grant execute on function private.valid_specs(jsonb) to authenticated, service_role;

alter table public.products
  add column slug text,
  add column details text not null default '' check (char_length(details) <= 4000),
  add column specs jsonb not null default '[]'::jsonb constraint products_specs_shape check (private.valid_specs(specs));

-- Existing products get an address from their name, oldest first; a repeat gets the next free -2, -3 and so on, so
-- "Foo" twice next to a "Foo 2" still ends up with three different addresses.
do $$
declare
  r record;
  v_base text;
  v_slug text;
  v_n integer;
begin
  for r in select id, name from public.products order by created_at, id loop
    v_base := private.slugify(r.name);
    v_slug := v_base;
    v_n := 1;
    while exists (select 1 from public.products p where p.slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;
    update public.products set slug = v_slug where id = r.id;
  end loop;
end;
$$;

alter table public.products
  alter column slug set not null,
  add constraint products_slug_unique unique (slug),
  add constraint products_slug_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80);

-- A new product without an address gets one from its name. An existing product keeps its address when renamed, so
-- shared links keep working.
create function private.fill_product_slug() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_base text;
  v_slug text;
  v_n integer := 1;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;
  -- Two products with the same name added at once would both find the same address free; take turns.
  perform pg_advisory_xact_lock(hashtext('fhd.product-slug'));
  v_base := private.slugify(new.name);
  v_slug := v_base;
  while exists (select 1 from public.products p where p.slug = v_slug and p.id <> new.id) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;
  new.slug := v_slug;
  return new;
end;
$$;
revoke all on function private.fill_product_slug() from public;
create trigger products_fill_slug before insert on public.products for each row execute function private.fill_product_slug();

grant select (slug, details, specs) on public.products to anon;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Consent. Every inquiry records when the visitor agreed to the terms and the exact wording they saw. Marketing
--    email is a separate, optional opt-in; a client who opted in once stays opted in until an admin records that they
--    asked to stop (Stage 5). Leaving the box empty on a later request is not a withdrawal.
-- ---------------------------------------------------------------------------------------------------------------
alter table public.inquiries
  add column terms_accepted_at timestamptz,
  add column marketing_opt_in boolean not null default false,
  add column consent_text text not null default '' check (char_length(consent_text) <= 1000);

alter table public.clients
  add column marketing_opt_in boolean not null default false,
  add column marketing_opt_in_at timestamptz;

-- Several interests can be ticked now: "Vending machines, Supplements".
alter table public.inquiries drop constraint inquiries_interest_check;
alter table public.inquiries add constraint inquiries_interest_check check (char_length(interest) between 1 and 200);

-- ---------------------------------------------------------------------------------------------------------------
-- 3. submit_inquiry: requires agreement to the terms, records consent, and opts the client in to marketing email only
--    when they ticked that box.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.submit_inquiry(p jsonb) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_submission uuid := (p->>'submission_id')::uuid;
  v_email text := lower(regexp_replace(coalesce(p->>'email', ''), '[[:space:][:cntrl:]' || chr(160) || chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279) || ']', '', 'g'));
  v_name text := btrim(regexp_replace(coalesce(p->>'name', ''), '[[:cntrl:]]+', ' ', 'g'));
  v_company text := btrim(regexp_replace(coalesce(p->>'company', ''), '[[:cntrl:]]+', ' ', 'g'));
  v_phone text := btrim(regexp_replace(coalesce(p->>'phone', ''), '[[:cntrl:]]+', ' ', 'g'));
  v_interest text := btrim(regexp_replace(coalesce(p->>'interest', ''), '[[:cntrl:]]+', ' ', 'g'));
  v_ip text := nullif(btrim(coalesce(p->>'ip_hash', '')), '');
  v_terms boolean := coalesce(p->'terms_accepted' = 'true'::jsonb, false);
  v_marketing boolean := coalesce(p->'marketing_opt_in' = 'true'::jsonb, false);
  v_consent text := left(btrim(coalesce(p->>'consent_text', '')), 1000);
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
  if not v_terms then
    return jsonb_build_object('status', 'invalid', 'field', 'terms');
  end if;

  if (v_ip is not null and not private.take_rate_limit('inquiry:ip:' || v_ip, 5, interval '1 hour'))
     or not private.take_rate_limit('inquiry:email:' || md5(regexp_replace(v_email, '\+[^@]*@', '@')), 3, interval '10 minutes')
     or not private.take_rate_limit('inquiry:all', 200, interval '1 hour') then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  insert into public.clients as c (email, name, company, phone, marketing_opt_in, marketing_opt_in_at)
  values (v_email, v_name, v_company, v_phone, v_marketing, case when v_marketing then now() end)
  on conflict (email) do update
    set company = case when c.company = '' then excluded.company else c.company end,
        phone = case when c.phone = '' then excluded.phone else c.phone end,
        marketing_opt_in = c.marketing_opt_in or excluded.marketing_opt_in,
        -- The first time they said yes. Saying yes again keeps it; each inquiry keeps its own time and wording.
        marketing_opt_in_at = case when excluded.marketing_opt_in and not c.marketing_opt_in then now() else c.marketing_opt_in_at end,
        last_active_at = now()
  returning c.id into v_client;

  insert into public.inquiries (submission_id, client_id, name, company, email, phone, interest, message,
                                terms_accepted_at, marketing_opt_in, consent_text)
  values (v_submission, v_client, v_name, v_company, v_email, v_phone, v_interest, coalesce(btrim(p->>'message'), ''),
          now(), v_marketing, v_consent)
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
