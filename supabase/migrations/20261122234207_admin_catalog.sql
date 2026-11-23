-- Adding categories from the admin: a new category gets its address from its name and goes to the end of the list.

-- A category added without an address gets one from its name, and one without a place goes last. Renaming keeps the
-- address, so links to the filtered catalog keep working.
create function private.fill_category() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_base text;
  v_slug text;
  v_n integer := 1;
begin
  -- Two categories added at once would both find the same address and the same last place free; take turns.
  perform pg_advisory_xact_lock(hashtext('fhd.category'));
  if new.slug is null or new.slug = '' then
    v_base := left(private.slugify(new.name), 36);
    v_base := coalesce(nullif(btrim(v_base, '-'), ''), 'category');
    v_slug := v_base;
    while exists (select 1 from public.categories c where c.slug = v_slug and c.id <> new.id) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;
    new.slug := v_slug;
  end if;
  if new.position is null or new.position = 0 then
    new.position := coalesce((select max(c.position) from public.categories c), 0) + 1;
  end if;
  return new;
end;
$$;
revoke all on function private.fill_category() from public;
create trigger categories_fill before insert on public.categories for each row execute function private.fill_category();
