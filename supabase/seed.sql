-- Seed data. Idempotent: fixed ids and ON CONFLICT DO NOTHING, so running it again changes nothing.
-- Site copy is loaded separately from design-system/site-copy.json (npm run db:sync-copy).

-- The three categories, in catalog order: vending machines first.
insert into public.categories (id, slug, name, icon, position) values
  ('7c1e0f4a-0001-4000-8000-000000000001', 'vending-machines', 'Vending machines', 'lockers', 1),
  ('7c1e0f4a-0002-4000-8000-000000000002', 'supplements', 'Supplements', 'jar-label', 2),
  ('7c1e0f4a-0003-4000-8000-000000000003', 'drinks', 'Drinks', 'drop', 3)
on conflict (id) do nothing;

-- SAMPLE PRODUCTS. Not real listings or prices. Each is marked is_sample, carries a "Sample" badge on the storefront
-- and a "Sample price" note. Replace or remove them before launch.
insert into public.products (id, category_id, name, sku, description, price_cents, price_note, stock_status, visible, is_sample) values
  ('5a3d9b2e-0001-4000-8000-000000000001', '7c1e0f4a-0001-4000-8000-000000000001', 'Combo vending machine, 40 selections', 'SAMPLE-VM-01',
   'Sample listing. Snacks and cold drinks in one cabinet. Card reader ready.', 425000, 'Sample price', 'in_stock', true, true),
  ('5a3d9b2e-0002-4000-8000-000000000002', '7c1e0f4a-0001-4000-8000-000000000001', 'Glass-front drink cooler, single door', 'SAMPLE-VM-02',
   'Sample listing. Holds 400 cans. Self-closing door.', 189000, 'Sample price', 'low_stock', true, true),
  ('5a3d9b2e-0003-4000-8000-000000000003', '7c1e0f4a-0001-4000-8000-000000000001', 'Snack vending machine, 32 selections', 'SAMPLE-VM-03',
   'Sample listing, hidden from the catalog.', 310000, 'Sample price', 'in_stock', false, true),
  ('5a3d9b2e-0004-4000-8000-000000000004', '7c1e0f4a-0002-4000-8000-000000000002', 'Whey protein isolate, vanilla, 2 lb', 'SAMPLE-SU-01',
   'Sample listing. 25 g of protein a serving. Sold by the case of six.', 3999, 'Sample price', 'in_stock', true, true),
  ('5a3d9b2e-0005-4000-8000-000000000005', '7c1e0f4a-0002-4000-8000-000000000002', 'Pre-workout, fruit punch, 30 servings', 'SAMPLE-SU-02',
   'Sample listing. 30 servings a tub.', 3200, 'Sample price', 'out_of_stock', true, true),
  ('5a3d9b2e-0006-4000-8000-000000000006', '7c1e0f4a-0003-4000-8000-000000000003', 'Electrolyte drink, citrus, case of 12', 'SAMPLE-DR-01',
   'Sample listing. Zero sugar. 16 oz bottles.', 2150, 'Sample price', 'in_stock', true, true),
  ('5a3d9b2e-0007-4000-8000-000000000007', '7c1e0f4a-0003-4000-8000-000000000003', 'Sparkling water, lime, case of 24', 'SAMPLE-DR-02',
   'Sample listing. 12 oz cans.', 1899, 'Sample price', 'in_stock', true, true)
on conflict (id) do nothing;

-- STARTER FAQ DRAFTS. Questions only, with no answers: they cover business policies that have not been approved,
-- so they cannot be published until the owner writes the answer. Publishing never includes an entry without one.
insert into public.faqs (id, question, answer, position, visible, is_starter) values
  ('9f2b6c1d-0001-4000-8000-000000000001', 'Which areas do you deliver to?', '', 1, true, true),
  ('9f2b6c1d-0002-4000-8000-000000000002', 'Do you install the machines?', '', 2, true, true),
  ('9f2b6c1d-0003-4000-8000-000000000003', 'What warranty comes with a machine?', '', 3, true, true),
  ('9f2b6c1d-0004-4000-8000-000000000004', 'How long does delivery take?', '', 4, true, true),
  ('9f2b6c1d-0005-4000-8000-000000000005', 'Can I return a product?', '', 5, true, true),
  ('9f2b6c1d-0006-4000-8000-000000000006', 'Do you offer financing?', '', 6, true, true)
on conflict (id) do nothing;
