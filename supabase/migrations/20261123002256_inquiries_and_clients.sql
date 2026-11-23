-- Inquiries and clients in the admin: status changes, marketing opt-outs, and activity the owner records by hand.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. Inquiry status. The admin sets only the status; the database stamps when it was read and replied to, so those
--    times can be trusted and never come from the browser.
-- ---------------------------------------------------------------------------------------------------------------
revoke update (read_at, replied_at) on public.inquiries from authenticated;

create function private.stamp_inquiry_status() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'new' then
      new.read_at := null;
      new.replied_at := null;
    elsif new.status = 'read' then
      new.read_at := coalesce(old.read_at, now());
      new.replied_at := null;
    elsif new.status = 'replied' then
      new.read_at := coalesce(old.read_at, now());
      new.replied_at := now();
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.stamp_inquiry_status() from public;
create trigger inquiries_stamp_status before update of status on public.inquiries
  for each row execute function private.stamp_inquiry_status();

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Marketing opt-out. An admin can record that a client wants no more marketing email. Only the client can opt in,
--    by ticking the box on the contact form; an admin turning it back on is refused.
-- ---------------------------------------------------------------------------------------------------------------
alter table public.clients add column marketing_opt_out_at timestamptz;
comment on column public.clients.marketing_opt_out_at is 'When an admin last recorded that the client wants no marketing email.';
grant update (marketing_opt_in) on public.clients to authenticated;

create function private.guard_client_marketing() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.marketing_opt_in is distinct from old.marketing_opt_in then
    if new.marketing_opt_in and current_user = 'authenticated' then
      raise exception 'Only the client can opt in to marketing email, from the contact form.' using errcode = '42501';
    end if;
    if not new.marketing_opt_in then
      new.marketing_opt_out_at := now();
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_client_marketing() from public;
create trigger clients_guard_marketing before update of marketing_opt_in on public.clients
  for each row execute function private.guard_client_marketing();

-- ---------------------------------------------------------------------------------------------------------------
-- 3. Activity keeps the client's first and last active dates in step: an inquiry, or something the owner records
--    (a call, a visit, an order by phone). Removing a recorded entry works them out again from what is left.
--    SECURITY DEFINER because admins may not edit those dates directly; it touches only the client of the row.
-- ---------------------------------------------------------------------------------------------------------------
create function private.sync_client_activity() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client uuid := coalesce(new.client_id, old.client_id);
begin
  if tg_op = 'INSERT' then
    update public.clients
    set last_active_at = greatest(last_active_at, new.occurred_at),
        first_active_at = least(first_active_at, new.occurred_at)
    where id = v_client;
  else
    update public.clients c
    set last_active_at = coalesce(a.last_at, c.created_at),
        first_active_at = coalesce(a.first_at, c.created_at)
    from (select max(occurred_at) as last_at, min(occurred_at) as first_at from public.client_activity where client_id = v_client) a
    where c.id = v_client;
  end if;
  return null;
end;
$$;
revoke all on function private.sync_client_activity() from public;
create trigger client_activity_sync after insert or delete on public.client_activity
  for each row execute function private.sync_client_activity();

-- Admins record activity by naming the client, the day and a note. The row's id and the time it was recorded are the
-- database's own, and activity recorded by hand belongs to no inquiry.
revoke insert on public.client_activity from authenticated;
grant insert (client_id, kind, note, occurred_at, created_by) on public.client_activity to authenticated;

-- Recorded activity happens on a day that has come, and says what it was in a line. created_at is always the moment of
-- recording; the few minutes allow for the app server's clock running a little ahead of the database's.
alter table public.client_activity
  add constraint client_activity_not_future check (occurred_at <= created_at + interval '5 minutes'),
  add constraint client_activity_note_one_line check (note !~ '[[:cntrl:]]');
