-- Where each inquiry came from, so the dashboard can show which channels bring clients in.
--
-- The browser notes, for the visit that ends in a request: the website that sent the visitor (its host name only, never
-- the full address), the utm_source, utm_medium and utm_campaign tags of the link they followed, and the first page they
-- opened. Nothing is stored for a visit that sends no request. The privacy page says so (section 4 below).

-- ---------------------------------------------------------------------------------------------------------------
-- 1. The columns. Empty when unknown: a typed address, a bookmark, an app that hides where a link came from.
-- ---------------------------------------------------------------------------------------------------------------
alter table public.inquiries
  add column referrer_host text not null default '',
  add column utm_source text not null default '',
  add column utm_medium text not null default '',
  add column utm_campaign text not null default '',
  add column landing_path text not null default '',
  add constraint inquiries_referrer_host_shape
    check (referrer_host = '' or (char_length(referrer_host) <= 253 and referrer_host ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$')),
  add constraint inquiries_utm_shape
    check (char_length(utm_source) <= 100 and char_length(utm_medium) <= 100 and char_length(utm_campaign) <= 100
           and utm_source ~ '^[a-z0-9 _.+-]*$' and utm_medium ~ '^[a-z0-9 _.+-]*$' and utm_campaign ~ '^[a-z0-9 _.+-]*$'),
  add constraint inquiries_landing_path_shape
    check (landing_path = '' or (char_length(landing_path) <= 200 and landing_path ~ '^/[^[:space:][:cntrl:]]*$'));

comment on column public.inquiries.referrer_host is 'The website that sent the visitor, host name only. Empty when the browser did not say.';
comment on column public.inquiries.landing_path is 'The first page of the visit that ended in this inquiry, without its query string.';

-- Admins read them like the rest of the inquiry; row level security already limits the rows to admins.
grant select (referrer_host, utm_source, utm_medium, utm_campaign, landing_path) on public.inquiries to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. submit_inquiry keeps the source. A source that does not fit is dropped, never the inquiry: a lead matters more
--    than knowing where it came from.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function private.clean_source_tag(p_value text) returns text
language sql
immutable
set search_path = ''
as $$
  -- Runs of anything else, spaces included, become one space. The site's own form folds accents first
  -- (lib/inquiry/source.ts), so this only makes sure whatever arrives fits the column.
  select btrim(left(btrim(regexp_replace(lower(coalesce(p_value, '')), '[^a-z0-9_.+-]+', ' ', 'g')), 100))
$$;
revoke all on function private.clean_source_tag(text) from public;
grant execute on function private.clean_source_tag(text) to service_role;

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
  v_source jsonb := case when jsonb_typeof(p->'source') = 'object' then p->'source' else '{}'::jsonb end;
  v_host text := lower(btrim(coalesce(v_source->>'referrer_host', '')));
  v_path text := btrim(coalesce(v_source->>'landing_path', ''));
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

  -- A source that does not fit its column is left out rather than refused.
  if char_length(v_host) > 253 or v_host !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$' then
    v_host := '';
  end if;
  if char_length(v_path) > 200 or v_path !~ '^/[^[:space:][:cntrl:]]*$' then
    v_path := '';
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
                                terms_accepted_at, marketing_opt_in, consent_text,
                                referrer_host, utm_source, utm_medium, utm_campaign, landing_path)
  values (v_submission, v_client, v_name, v_company, v_email, v_phone, v_interest, coalesce(btrim(p->>'message'), ''),
          now(), v_marketing, v_consent,
          v_host, private.clean_source_tag(v_source->>'utm_source'), private.clean_source_tag(v_source->>'utm_medium'),
          private.clean_source_tag(v_source->>'utm_campaign'), v_path)
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
-- 3. Inquiries by source over the last 30, 60 and 90 days, with how many converted (the dashboard's test: the client
--    has an order on or after the inquiry's day). Grouped by the raw tags and host; the page names the channels.
--    Runs as the caller, so row level security applies as well as the check. p_now exists so the tests can pin the clock.
-- ---------------------------------------------------------------------------------------------------------------
create function public.inquiry_sources(p_tz text default 'UTC', p_now timestamptz default now())
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_tz text := coalesce(nullif(btrim(p_tz), ''), 'UTC');
  v_today date;
  v_periods jsonb;
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can read the dashboard.' using errcode = '42501';
  end if;

  -- A time zone the database does not know falls back to UTC rather than failing the page.
  begin
    v_today := (p_now at time zone v_tz)::date;
  exception when others then
    v_tz := 'UTC';
    v_today := (p_now at time zone v_tz)::date;
  end;

  select jsonb_agg(jsonb_build_object('days', n, 'sources', coalesce(g.sources, '[]'::jsonb)) order by n)
  into v_periods
  from unnest(array[30, 60, 90]) as n
  cross join lateral (
    select jsonb_agg(jsonb_build_object(
             'utmSource', s.utm_source, 'utmMedium', s.utm_medium, 'utmCampaign', s.utm_campaign,
             'referrerHost', s.referrer_host, 'inquiries', s.inquiries, 'converted', s.converted
           ) order by s.inquiries desc, s.utm_source, s.utm_medium, s.utm_campaign, s.referrer_host) as sources
    from (
      select i.utm_source, i.utm_medium, i.utm_campaign, i.referrer_host, count(*) as inquiries,
             count(*) filter (where exists (
               select 1 from public.client_activity o
               where o.client_id = i.client_id and o.kind = 'order' and o.occurred_at <= p_now
                 and (o.occurred_at at time zone v_tz)::date >= (i.created_at at time zone v_tz)::date
             )) as converted
      from public.inquiries i
      where i.created_at >= ((v_today - (n - 1))::timestamp at time zone v_tz) and i.created_at <= p_now
      group by i.utm_source, i.utm_medium, i.utm_campaign, i.referrer_host
    ) s
  ) g;

  return jsonb_build_object('today', v_today, 'periods', v_periods);
end;
$$;
comment on function public.inquiry_sources(text, timestamptz) is 'Admin only. Inquiries over the last 30, 60 and 90 days by utm tags and referring host, with conversions.';

revoke all on function public.inquiry_sources(text, timestamptz) from public, anon;
grant execute on function public.inquiry_sources(text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- 4. The privacy page says what is recorded. Live and draft text move to the new wording only where the owner has not
--    rewritten it; the copy sync updates the original from design-system/site-copy.json.
-- ---------------------------------------------------------------------------------------------------------------
update public.live_copy set text = $copy$When you send a request we receive your name, your email address and what you are interested in, plus anything else you choose to give us: your company, phone number, message and the products you picked. We also record that you agreed to our terms and whether you asked for marketing emails, with the time and the wording you saw. We also note how you found the site: the website that sent you here, if any, the tags in the link you followed, such as the campaign or ad it came from, and the first page you opened.

To block spam we keep a scrambled code made from your internet address, not the address itself, and use it only to stop repeated requests.$copy$ where key = 'privacy.s1.body' and text = $copy$When you send a request we receive your name, your email address and what you are interested in, plus anything else you choose to give us: your company, phone number, message and the products you picked. We also record that you agreed to our terms and whether you asked for marketing emails, with the time and the wording you saw.

To block spam we keep a scrambled code made from your internet address, not the address itself, and use it only to stop repeated requests.$copy$;
update public.site_content set draft = $copy$When you send a request we receive your name, your email address and what you are interested in, plus anything else you choose to give us: your company, phone number, message and the products you picked. We also record that you agreed to our terms and whether you asked for marketing emails, with the time and the wording you saw. We also note how you found the site: the website that sent you here, if any, the tags in the link you followed, such as the campaign or ad it came from, and the first page you opened.

To block spam we keep a scrambled code made from your internet address, not the address itself, and use it only to stop repeated requests.$copy$ where key = 'privacy.s1.body' and draft = $copy$When you send a request we receive your name, your email address and what you are interested in, plus anything else you choose to give us: your company, phone number, message and the products you picked. We also record that you agreed to our terms and whether you asked for marketing emails, with the time and the wording you saw.

To block spam we keep a scrambled code made from your internet address, not the address itself, and use it only to stop repeated requests.$copy$;
update public.live_copy set text = $copy$This site does not use advertising or tracking cookies. The products you pick are kept in your own browser, not on our servers, so they are still there when you come back. Sending your request clears them. How you found the site is kept in your browser too, only until you close the tab, and reaches us only with a request.$copy$ where key = 'privacy.s4.body' and text = $copy$This site does not use advertising or tracking cookies. The products you pick are kept in your own browser, not on our servers, so they are still there when you come back. Sending your request clears them.$copy$;
update public.site_content set draft = $copy$This site does not use advertising or tracking cookies. The products you pick are kept in your own browser, not on our servers, so they are still there when you come back. Sending your request clears them. How you found the site is kept in your browser too, only until you close the tab, and reaches us only with a request.$copy$ where key = 'privacy.s4.body' and draft = $copy$This site does not use advertising or tracking cookies. The products you pick are kept in your own browser, not on our servers, so they are still there when you come back. Sending your request clears them.$copy$;
