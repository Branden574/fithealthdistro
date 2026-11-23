# Button

The action control: an uppercase Big Shoulders label inside a 2px edge with 2px corners.

## Variants

- `primary` is the volt fill (`accent`, label `on-accent`, edge `accent-ink`). One per view, for the thing the page is for: "Request a quote", "Add product", "Send request".
- `solid` is `ink` with a `bg` label. A second strong action beside a primary.
- `outline` is the default. Everything that is not the main action.
- `ghost` has no edge. Cancel, and the icon-only row actions in a table.
- `danger` fills with `danger`. Only for removing something, and only as the confirming button in a Dialog or the button that opens one.

## Sizes

`sm` (32px) in table rows, panel headers and the nav bar. `md` (40px) in forms and across the admin. `lg` (48px) in the storefront hero and at the end of the contact form.

## You provide

The label, verb first, two or three words, typed in sentence case (the capitals are CSS). An `aria-label` for an `icon` button. `href` when the button goes to another page.

Add `newTab` only when the page should stay open behind the link, such as "Preview site" beside an editor with unsaved work. Pair it with `newTabLabel` ("(opens in a new tab)") so screen readers say so, and an `arrow-up-right` icon so sighted users can tell.

## Don't

- Don't put two `primary` buttons in one view.
- Don't type the label in capitals or add an exclamation mark.
- Don't use `danger` for anything that can be undone with one click; hiding a product is a Switch.
