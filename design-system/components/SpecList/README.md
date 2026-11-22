# SpecList

A product's specifications on its own page: one row per spec, the label beside the value.

A `dl` under a `border-thick` `ink` rule, one `line` hairline per row, like the hero's category index and the RequestList. The label is 14px semibold `ink-muted`; the value is 16px `ink`. Under 400px the value drops under its label.

## You provide

`items`: `{ label, value }` rows in the order the owner set them. Labels are sentence case ("Selections", "Power", "Sold by"); values carry their units ("40", "115 V", "Case of 6"). The admin limits a label to 40 characters, a value to 200 and a product to 30 rows.

With no rows it renders nothing, so leave the heading out too.

## Don't

- Don't put prices here. The price and its note sit with the button.
- Don't make health claims for supplements. List what is in the tub.
