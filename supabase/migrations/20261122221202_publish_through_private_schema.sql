-- publish_site's privileged work moves into the private schema, which the Data API cannot reach. The public entry
-- point now runs with the caller's rights and only hands over to it; both check the caller is an admin.

drop function public.publish_site();

create function private.publish_site() returns public.publications
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
revoke all on function private.publish_site() from public;
grant execute on function private.publish_site() to authenticated;

-- The RPC the admin calls: /rest/v1/rpc/publish_site.
create function public.publish_site() returns public.publications
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can publish.' using errcode = '42501';
  end if;
  return private.publish_site();
end;
$$;
revoke all on function public.publish_site() from public, anon;
grant execute on function public.publish_site() to authenticated;
