-- Admin catalog work: categories added from the admin, and the writes only an admin may make. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000004a1', 'catalog-owner@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000004b2', 'catalog-someone@example.test', 'authenticated', 'authenticated');
insert into public.admins (user_id, email, name) values ('00000000-0000-4000-8000-0000000004a1', 'catalog-owner@example.test', 'Owner');

-- ---------------------------------------------------------------------------------------------------------------
-- As the admin
-- ---------------------------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000004a1", "role": "authenticated"}', true);

select lives_ok($$ insert into public.categories (name, icon) values ('Protein bars', 'barbell') $$, 'an admin adds a category with just a name and an icon');
select is((select slug from public.categories where name = 'Protein bars'), 'protein-bars', 'it gets an address from its name');
select is((select position from public.categories where name = 'Protein bars'),
  (select max(position) from public.categories), 'and goes to the end of the list');
select lives_ok($$ insert into public.categories (name, icon) values ('Protein  bars!', 'pill') $$, 'a second category whose name makes the same address');
select is((select slug from public.categories where name = 'Protein  bars!'), 'protein-bars-2', 'gets the next free address');
select ok((select position from public.categories where name = 'Protein  bars!') > (select position from public.categories where name = 'Protein bars'),
  'and goes after the one before it');

update public.categories set name = 'Bars' where slug = 'protein-bars';
select is((select slug from public.categories where name = 'Bars'), 'protein-bars', 'renaming keeps the address, so filtered links keep working');
select throws_ok($$ insert into public.categories (name, icon) values ('Snacks', 'pizza') $$, '23514', null, 'the icon must be one of the catalog icons');
select throws_ok($$ insert into public.categories (name, icon) values (' Snacks', 'package') $$, '23514', null, 'a name cannot start or end with a space');
select throws_ok($$ insert into public.categories (name, icon) values (repeat('x', 41), 'package') $$, '23514', null, 'a name stops at 40 characters');

select lives_ok($$ insert into public.products (category_id, name, sku) select id, 'Chocolate bar, box of 12', 'BAR-12' from public.categories where slug = 'protein-bars' $$,
  'an admin adds a product');
select is((select visible from public.products where sku = 'BAR-12'), false, 'a new product starts out of the catalog');
select lives_ok($$ update public.products set visible = true where sku = 'BAR-12' $$, 'an admin shows it in the catalog');
select throws_ok($$ insert into public.products (category_id, name, sku) select id, 'Copy', 'BAR-12' from public.categories where slug = 'protein-bars' $$,
  '23505', null, 'two products cannot share a SKU');
select throws_ok($$ delete from public.categories where slug = 'protein-bars' $$, '23503', null, 'a category with products in it cannot be removed');
select lives_ok($$ delete from public.products where sku = 'BAR-12' $$, 'an admin removes a product');

-- ---------------------------------------------------------------------------------------------------------------
-- As someone signed in but not on the allowlist
-- ---------------------------------------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000004b2", "role": "authenticated"}', true);
select throws_ok($$ insert into public.categories (name, icon) values ('Not allowed', 'package') $$, '42501', null, 'a signed-in user who is not an admin cannot add a category');
select is((select count(*)::int from public.products), 0, 'and sees no products, not even visible ones');
update public.categories set name = 'Taken over' where slug = 'protein-bars';
reset role;
select is((select name from public.categories where slug = 'protein-bars'), 'Bars', 'nor rename one');

-- ---------------------------------------------------------------------------------------------------------------
-- As a visitor
-- ---------------------------------------------------------------------------------------------------------------
set local role anon;
select throws_ok($$ insert into public.categories (name, icon) values ('Not allowed', 'package') $$, '42501', null, 'a visitor cannot add a category');
select throws_ok($$ update public.products set visible = true $$, '42501', null, 'a visitor cannot change products');
reset role;

select * from finish();
rollback;
