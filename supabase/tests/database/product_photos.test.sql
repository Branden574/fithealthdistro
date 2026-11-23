-- Several photos per product; the first is the cover. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000007a1', 'photos-owner@example.test', 'authenticated', 'authenticated');
insert into public.admins (user_id, email, name) values ('00000000-0000-4000-8000-0000000007a1', 'photos-owner@example.test', 'Owner');
insert into public.categories (id, slug, name, icon, position) values
  ('00000000-0000-4000-8000-00000000c701', 'photo-test', 'Photo test', 'package', 97);
insert into public.products (id, category_id, name, sku, visible) values
  ('00000000-0000-4000-8000-00000000d701', '00000000-0000-4000-8000-00000000c701', 'Photo product', 'PHOTO-1', true),
  ('00000000-0000-4000-8000-00000000d702', '00000000-0000-4000-8000-00000000c701', 'Hidden photo product', 'PHOTO-2', false);

-- ---------------------------------------------------------------------------------------------------------------
-- Photos, as the admin
-- ---------------------------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000007a1", "role": "authenticated"}', true);

select is((select photos from public.products where sku = 'PHOTO-1'), '{}'::text[], 'a new product has no photos');
select lives_ok($$ update public.products set photos = array[
    '00000000-0000-4000-8000-00000000d701/a.jpg', '00000000-0000-4000-8000-00000000d701/b.png', '00000000-0000-4000-8000-00000000d701/c.webp']
  where sku = 'PHOTO-1' $$, 'an admin saves three photos from the product''s own folder');
select is((select image_path from public.products where sku = 'PHOTO-1'), '00000000-0000-4000-8000-00000000d701/a.jpg', 'the first is the cover');
update public.products set photos = array[
  '00000000-0000-4000-8000-00000000d701/c.webp', '00000000-0000-4000-8000-00000000d701/a.jpg', '00000000-0000-4000-8000-00000000d701/b.png']
where sku = 'PHOTO-1';
select is((select image_path from public.products where sku = 'PHOTO-1'), '00000000-0000-4000-8000-00000000d701/c.webp', 'moving a photo first makes it the cover');
update public.products set name = 'Photo product, renamed' where sku = 'PHOTO-1';
select is((select cardinality(photos) from public.products where sku = 'PHOTO-1'), 3, 'other edits leave the photos alone');

select throws_ok($$ update public.products set photos = (select array_agg('00000000-0000-4000-8000-00000000d701/p' || g || '.jpg') from generate_series(1, 9) g) where sku = 'PHOTO-1' $$,
  '23514', null, 'at most 8 photos');
select lives_ok($$ update public.products set photos = (select array_agg('00000000-0000-4000-8000-00000000d701/p' || g || '.jpg') from generate_series(1, 8) g) where sku = 'PHOTO-1' $$,
  'exactly 8 is fine');
select throws_ok($$ update public.products set photos = array['00000000-0000-4000-8000-00000000d701/a.jpg', '00000000-0000-4000-8000-00000000d701/a.jpg'] where sku = 'PHOTO-1' $$,
  '23514', null, 'the same photo cannot be in the list twice');
select throws_ok($$ update public.products set photos = array['00000000-0000-4000-8000-00000000d702/a.jpg'] where sku = 'PHOTO-1' $$,
  '23514', null, 'a photo must be in the product''s own folder');
select throws_ok($$ update public.products set photos = array['00000000-0000-4000-8000-00000000d701/a.gif'] where sku = 'PHOTO-1' $$,
  '23514', null, 'only JPEG, PNG and WebP');
select throws_ok($$ update public.products set photos = array['00000000-0000-4000-8000-00000000d701/../x.jpg'] where sku = 'PHOTO-1' $$,
  '23514', null, 'no other path shapes');
select throws_ok($$ update public.products set photos = array[null]::text[] where sku = 'PHOTO-1' $$, '23514', null, 'no empty entries');
select throws_ok($$ update public.products set photos = null where sku = 'PHOTO-1' $$, '23502', null, 'the list itself is never null');
update public.products set photos = '{}' where sku = 'PHOTO-1';
select is((select image_path from public.products where sku = 'PHOTO-1'), null, 'removing every photo removes the cover');

-- The site from before photos, still running during a release, writes only image_path.
update public.products set image_path = '00000000-0000-4000-8000-00000000d701/old.jpg' where sku = 'PHOTO-1';
select is((select photos from public.products where sku = 'PHOTO-1'), array['00000000-0000-4000-8000-00000000d701/old.jpg'],
  'a photo written to image_path alone becomes the list');
update public.products set image_path = '00000000-0000-4000-8000-00000000d701/new.jpg' where sku = 'PHOTO-1';
select is((select photos from public.products where sku = 'PHOTO-1'), array['00000000-0000-4000-8000-00000000d701/new.jpg'],
  'and replacing it there replaces the cover, so the list never keeps a photo that code deleted');
update public.products set image_path = null where sku = 'PHOTO-1';
select is((select photos from public.products where sku = 'PHOTO-1'), '{}'::text[], 'clearing image_path clears the cover');
select throws_ok($$ update public.products set image_path = '00000000-0000-4000-8000-00000000d702/a.jpg' where sku = 'PHOTO-1' $$,
  '23514', null, 'image_path written alone is checked like the list');

insert into public.products (id, category_id, name, sku, image_path) values
  ('00000000-0000-4000-8000-00000000d703', '00000000-0000-4000-8000-00000000c701', 'Old-style product', 'PHOTO-3', '00000000-0000-4000-8000-00000000d703/a.jpg');
select is((select photos from public.products where sku = 'PHOTO-3'), array['00000000-0000-4000-8000-00000000d703/a.jpg'],
  'a product added with only image_path keeps its photo');
insert into public.products (id, category_id, name, sku, photos, image_path) values
  ('00000000-0000-4000-8000-00000000d704', '00000000-0000-4000-8000-00000000c701', 'New-style product', 'PHOTO-4',
   array['00000000-0000-4000-8000-00000000d704/b.jpg'], '00000000-0000-4000-8000-00000000d704/a.jpg');
select is((select image_path from public.products where sku = 'PHOTO-4'), '00000000-0000-4000-8000-00000000d704/b.jpg', 'given both, the list wins');

update public.products set photos = array['00000000-0000-4000-8000-00000000d701/a.jpg', '00000000-0000-4000-8000-00000000d701/b.jpg'] where sku = 'PHOTO-1';
update public.products set photos = array['00000000-0000-4000-8000-00000000d702/a.jpg'] where sku = 'PHOTO-2';
reset role;

-- ---------------------------------------------------------------------------------------------------------------
-- What visitors can read
-- ---------------------------------------------------------------------------------------------------------------
set local role anon;
select is((select cardinality(photos) from public.products where id = '00000000-0000-4000-8000-00000000d701'), 2, 'visitors read a visible product''s photos');
select is((select count(*)::int from public.products where id = '00000000-0000-4000-8000-00000000d702'), 0, 'a hidden product''s photos stay hidden');
select throws_ok($$ update public.products set photos = '{}' where id = '00000000-0000-4000-8000-00000000d701' $$, '42501', null, 'visitors cannot change photos');
reset role;

select * from finish();
rollback;
