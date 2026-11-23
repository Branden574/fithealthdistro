-- Several photos per product. The first is the cover.

-- ---------------------------------------------------------------------------------------------------------------
-- Photos: up to eight, in the order the owner set. The first is the cover: the catalog card, link previews and the
-- product page's first slide. Each lives in the product's own folder of the product-photos bucket, as uploads do.
-- ---------------------------------------------------------------------------------------------------------------
create function private.valid_product_photos(p_id uuid, p_photos text[]) returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_photos is null then false
    when cardinality(p_photos) > 8 then false
    when (select count(distinct x.path) from unnest(p_photos) as x(path)) <> cardinality(p_photos) then false
    else not exists (
      select 1 from unnest(p_photos) as x(path)
      where x.path is null
         or char_length(x.path) > 120
         or x.path !~ ('^' || p_id::text || '/[0-9a-z-]{1,64}\.(jpg|png|webp)$')
    )
  end;
$$;
revoke all on function private.valid_product_photos(uuid, text[]) from public;
-- Pure and data-free. Admins need it: the check runs as whoever writes the product.
grant execute on function private.valid_product_photos(uuid, text[]) to authenticated, service_role;

alter table public.products
  add column photos text[] not null default '{}',
  add constraint products_photos_valid check (private.valid_product_photos(id, photos));

comment on column public.products.photos is 'Up to 8 photo paths in the product-photos bucket, in display order. The first is the cover.';
comment on column public.products.image_path is 'The cover, kept equal to photos[1] by a trigger for anything still reading it. Can be dropped once nothing does.';

-- Every existing photo becomes the first of its product's list.
update public.products
set photos = array[image_path]
where image_path is not null and private.valid_product_photos(id, array[image_path]);

-- image_path follows the list. Code that only knows image_path (the site from before this, still running while a
-- release rolls out) keeps working: what it writes there becomes the cover, so the list never points at a photo that
-- code has just deleted from storage.
create function private.cover_from_photos() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and cardinality(new.photos) = 0 and new.image_path is not null then
    new.photos := array[new.image_path];
  elsif tg_op = 'UPDATE' and new.photos is not distinct from old.photos and new.image_path is distinct from old.image_path then
    new.photos := case
      when new.image_path is null then coalesce(old.photos[2:], '{}')
      else array[new.image_path] || array_remove(coalesce(old.photos[2:], '{}'), new.image_path)
    end;
  end if;
  new.image_path := new.photos[1];
  return new;
end;
$$;
revoke all on function private.cover_from_photos() from public;
create trigger products_cover_from_photos before insert or update of photos, image_path on public.products
  for each row execute function private.cover_from_photos();

-- Visitors read them, like the rest of a visible product.
grant select (photos) on public.products to anon;
