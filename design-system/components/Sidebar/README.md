# Sidebar

The admin's navigation rail. The current page is a volt block.

It is dark by default against the light `bg-subtle` admin canvas, and `sidebar` (256px) wide. Items are Archivo 600 with a Phosphor glyph; the current one fills with `accent` and reads in `on-accent`.

## You provide

- `sections`: groups of items, each group with an optional `title`. An item has `id`, `label`, `icon` and optionally `count` and `href`.
- `current`: the `id` of the page being shown, and `onSelect` when items are buttons.
- `user`: the signed-in admin's `name` and `role`, and `onSignOut`.

## Sections used here

Dashboard alone at the top. Catalog: Products, Categories. Clients: Inquiries, Clients, Retention. Website: Site content. Account: Settings.

## Counts

A count says how many are waiting (new inquiries) or how many exist (products). Leave it off everything else.

## Layout

Give it the full height of the window: place it in the first column of a two-column grid, with the page in the second.

Under 900px wide, stack the grid to one column with the Sidebar first. It becomes a bar across the top: the brand, then every item in one row that scrolls sideways (section titles drop out), then the signed-in admin.

## Don't

- Don't nest items. Two levels are sections and items.
- Don't put actions in the rail. "Add product" belongs to the page.
