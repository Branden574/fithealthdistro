# EmptyState

What a list shows before it has anything in it, with the one action that fills it.

## You provide

- `title`: what is missing, in three or four words ("No inquiries yet", "No products match").
- `description`: one sentence on why, or what to do.
- `action`: at most one Button.
- `icon`: the glyph for the thing that is missing (`tray` for inquiries, `package` for products).

Pass it to a DataTable through `empty`, with `compact`, or place it alone inside a Panel.

## Don't

- Don't apologise or joke. Say what goes here and how to add it.
- Don't show an empty state while data is still loading.
