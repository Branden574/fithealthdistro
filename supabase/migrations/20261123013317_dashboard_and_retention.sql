-- Stage 7: orders with amounts, and the numbers behind the dashboard and the retention page.
--
-- Definitions the owner approved:
--   * A client is active in a month when they sent an inquiry, or an admin recorded activity or an order for them.
--   * Retention for a month uses rolling three-month windows: of the clients active in the three months before the
--     window that ends with that month, the share active again inside it. With nobody active in the earlier window
--     there is nothing to measure, and the month has no figure.
--   * Orders are recorded by an admin on the client's page, with the order's total in dollars.
--   * An inquiry converts once its client has an order dated on or after the day the inquiry came in, whenever the
--     order is recorded. A period's conversion covers the inquiries received in that period.
-- Days and months are the admin's calendar, in the time zone the page passes in.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. Orders carry their total. Every order has one; nothing else does.
-- ---------------------------------------------------------------------------------------------------------------
alter table public.client_activity
  add column amount numeric(12, 2),
  add constraint client_activity_order_amount check ((kind = 'order') = (amount is not null)),
  add constraint client_activity_amount_range check (amount is null or (amount > 0 and amount <= 10000000));
comment on column public.client_activity.amount is 'The order total in US dollars. Set on orders only.';

grant insert (amount) on public.client_activity to authenticated;

-- Admins record and remove orders the same way as other activity. Inquiries stay the contact form's own.
drop policy "Admins record activity" on public.client_activity;
create policy "Admins record activity" on public.client_activity for insert to authenticated
  with check ((select private.is_admin()) and kind in ('manual', 'order') and created_by = (select auth.uid()));
drop policy "Admins remove recorded activity" on public.client_activity;
create policy "Admins remove recorded activity" on public.client_activity for delete to authenticated
  using ((select private.is_admin()) and kind in ('manual', 'order'));

create index client_activity_orders_idx on public.client_activity (occurred_at) where kind = 'order';
create index client_activity_client_orders_idx on public.client_activity (client_id, occurred_at) where kind = 'order';

-- ---------------------------------------------------------------------------------------------------------------
-- 2. The dashboard's numbers, in one read. Runs as the caller, so row level security applies as well as the check.
--    p_now exists so the tests can pin the clock; the page always passes the current time.
-- ---------------------------------------------------------------------------------------------------------------
create function public.dashboard_stats(p_tz text default 'UTC', p_now timestamptz default now())
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_tz text := coalesce(nullif(btrim(p_tz), ''), 'UTC');
  v_today date;
  v_month date;
  v_months jsonb;
  v_periods jsonb;
  v_inquiries jsonb;
  v_products jsonb;
  v_orders bigint;
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
  v_month := date_trunc('month', v_today)::date;

  -- Retention for this month and the eleven before it. Each month needs the five months before it as well.
  with active as (
    select distinct a.client_id, date_trunc('month', a.occurred_at at time zone v_tz)::date as month
    from public.client_activity a
    where a.occurred_at >= ((v_month - interval '16 months')::timestamp at time zone v_tz)
      and a.occurred_at <= p_now
  ),
  months as (
    select (v_month - make_interval(months => g))::date as month from generate_series(0, 11) g
  ),
  windows as (
    select m.month,
      (m.month - interval '2 months')::date as now_from,
      (m.month - interval '5 months')::date as before_from,
      (m.month - interval '3 months')::date as before_to
    from months m
  ),
  counted as (
    select w.month,
      (select count(distinct b.client_id) from active b where b.month between w.before_from and w.before_to) as previous,
      (select count(distinct c.client_id) from active c where c.month between w.now_from and w.month) as active,
      (select count(distinct b.client_id) from active b
        where b.month between w.before_from and w.before_to
          and exists (select 1 from active c where c.client_id = b.client_id and c.month between w.now_from and w.month)) as returned
    from windows w
  )
  select jsonb_agg(jsonb_build_object('month', month, 'previous', previous, 'active', active, 'returned', returned) order by month)
  into v_months
  from counted;

  -- Inquiries received in the last 7 days (today and the six before) and the 7 before those, and how many are unread.
  select jsonb_build_object(
    'recent', count(*) filter (where i.created_at >= ((v_today - 6)::timestamp at time zone v_tz)),
    'previous', count(*) filter (where i.created_at < ((v_today - 6)::timestamp at time zone v_tz)
                                  and i.created_at >= ((v_today - 13)::timestamp at time zone v_tz)),
    'unread', (select count(*) from public.inquiries u where u.status = 'new')
  )
  into v_inquiries
  from public.inquiries i
  where i.created_at >= ((v_today - 13)::timestamp at time zone v_tz) and i.created_at <= p_now;

  select jsonb_build_object('live', count(*) filter (where p.visible), 'hidden', count(*) filter (where not p.visible))
  into v_products
  from public.products p;

  select count(*) into v_orders from public.client_activity a where a.kind = 'order' and a.occurred_at <= p_now;

  -- Sales and conversion over the last 30, 60 and 90 days, each beside the same number of days before it, and the
  -- period's sales in six equal slices for the chart.
  select jsonb_agg(stats order by days)
  into v_periods
  from (
    select n as days,
      jsonb_build_object(
        'days', n,
        'sales', s.sales, 'orders', s.orders,
        'previousSales', s.previous_sales, 'previousOrders', s.previous_orders,
        'inquiries', c.inquiries, 'converted', c.converted,
        'previousInquiries', c.previous_inquiries, 'previousConverted', c.previous_converted,
        'slices', sl.slices
      ) as stats
    from unnest(array[30, 60, 90]) as n
    cross join lateral (
      select ((v_today - (n - 1))::timestamp at time zone v_tz) as starts,
             ((v_today - (2 * n - 1))::timestamp at time zone v_tz) as before_starts
    ) w
    cross join lateral (
      select coalesce(sum(o.amount) filter (where o.occurred_at >= w.starts), 0) as sales,
             count(*) filter (where o.occurred_at >= w.starts) as orders,
             coalesce(sum(o.amount) filter (where o.occurred_at < w.starts), 0) as previous_sales,
             count(*) filter (where o.occurred_at < w.starts) as previous_orders
      from public.client_activity o
      where o.kind = 'order' and o.occurred_at >= w.before_starts and o.occurred_at <= p_now
    ) s
    cross join lateral (
      select count(*) filter (where q.created_at >= w.starts) as inquiries,
             count(*) filter (where q.created_at >= w.starts and q.converted) as converted,
             count(*) filter (where q.created_at < w.starts) as previous_inquiries,
             count(*) filter (where q.created_at < w.starts and q.converted) as previous_converted
      from (
        select i.created_at,
          exists (
            select 1 from public.client_activity o
            where o.client_id = i.client_id and o.kind = 'order' and o.occurred_at <= p_now
              and (o.occurred_at at time zone v_tz)::date >= (i.created_at at time zone v_tz)::date
          ) as converted
        from public.inquiries i
        where i.created_at >= w.before_starts and i.created_at <= p_now
      ) q
    ) c
    cross join lateral (
      select jsonb_agg(jsonb_build_object('end', e.last_day, 'sales', coalesce((
          select sum(o.amount) from public.client_activity o
          where o.kind = 'order' and o.occurred_at <= p_now
            and o.occurred_at >= ((e.last_day - (n / 6 - 1))::timestamp at time zone v_tz)
            and o.occurred_at < ((e.last_day + 1)::timestamp at time zone v_tz)
        ), 0)) order by e.last_day) as slices
      from (select v_today - (5 - k) * (n / 6) as last_day from generate_series(0, 5) k) e
    ) sl
  ) p;

  return jsonb_build_object(
    'today', v_today,
    'timeZone', v_tz,
    'months', v_months,
    'inquiries', v_inquiries,
    'products', v_products,
    'ordersRecorded', v_orders,
    'periods', v_periods
  );
end;
$$;
comment on function public.dashboard_stats(text, timestamptz) is 'Admin only. Retention by month, recent inquiries, products live, and sales and conversion over 30, 60 and 90 days.';

revoke all on function public.dashboard_stats(text, timestamptz) from public, anon;
grant execute on function public.dashboard_stats(text, timestamptz) to authenticated;
