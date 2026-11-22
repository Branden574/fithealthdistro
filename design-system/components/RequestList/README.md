# RequestList

The products a client has picked in the catalog, shown beside the contact form: "3 products in your request". It is a request for a quote, not a cart, so it holds no prices or quantities.

A raised card like the form beside it. The title is an `eyebrow`, the count under it is `title`, and the products sit under a `border-thick` `ink` rule, one `line` hairline each, with the category glyph, the name, the category and a `ghost` Remove button.

## You provide

- `title`: "Your request".
- `summary`: the count, already written out from the site copy ("1 product in your request", "3 products in your request").
- `items`: `{ id, name, category, icon }` for each product, in the order the client added them.
- `empty`: one sentence that says how to add something, shown while the list is empty.
- `removeLabel`, and `removeAriaLabel` to name each button for screen readers. Start that name with the visible label: "Remove Whey protein isolate from your request".
- `onRemove`, called with the product's id.
- `headingLevel`: the level that fits the page, `3` by default under a section's `h2`.

## Behavior

- A product that arrives slides up `motion-shift-sm` and fades in on `duration-overlay`; the count does the same each time it changes. Under `prefers-reduced-motion` both change at once.
- After a Remove, focus moves to the next product's Remove button, or to the title once the list is empty, so a keyboard never drops back to the top of the page.
- The list does not announce itself. Say what changed through one shared polite live region on the page, from the site copy ("Whey protein isolate is out of your request."), so the catalog and the list never speak over each other.

## Don't

- Don't show prices or totals. When online ordering is switched on, the cart is a separate view.
- Don't hide it while it is empty. The empty sentence tells the client what the catalog's button does.
