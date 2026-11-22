# Panel

The container for one block of the admin: a chart, a table, a form.

A `bg-raised` surface with a `line` edge and `radius-md` corners. The title is `display-sm`.

## You provide

- `title`, and `description` to say what the block shows or how a figure is worked out.
- `actions`: a small Button or a Chip at the top right.
- `footer`: a quiet line along the bottom ("Showing 5 of 42").
- `flush` to drop the body padding, so a DataTable or Tabs run edge to edge.

`tone="inverse"` paints the panel near-black. Use it for at most one block on a page, to set it apart.

## Don't

- One job per panel. Two charts are two panels.
- Don't nest panels, and don't put a card with its own edge (InquiryCard, ProductCard) inside one.
