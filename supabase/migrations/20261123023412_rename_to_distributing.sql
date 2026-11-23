-- The business is Fit Health Distributing, as on its logo. The site text it shipped with said "Fit Health Distribution";
-- rename it wherever stored text still says so: the shipped original, the admin's draft and the live text. Text the
-- owner has rewritten without the old name is left alone. A fresh database has no text yet at this point; the copy
-- sync then loads the new wording from design-system/site-copy.json.

update public.site_content
set
  original = replace(original, 'Fit Health Distribution', 'Fit Health Distributing'),
  draft = replace(draft, 'Fit Health Distribution', 'Fit Health Distributing')
where original like '%Fit Health Distribution%' or draft like '%Fit Health Distribution%';

update public.live_copy
set text = replace(text, 'Fit Health Distribution', 'Fit Health Distributing')
where text like '%Fit Health Distribution%';
