# Switch

An on/off setting that takes effect at once.

Its main job here is "Show in catalog": hiding a product from clients without removing it. On is an orange track (`accent`) with an ink thumb and an `accent-ink` edge. Off is a `line-strong` track.

## You provide

`label`, which names the setting, and optionally `hint`, which says what the current state means ("Clients can see this product and ask for a quote."). In a table cell pass an `aria-label` that names the row. `checked` with `onChange`, or `defaultChecked`.

## Use it for

- Showing or hiding a product in the catalog.
- Account settings that save immediately, such as "Email me new inquiries".

## Don't

- Don't use a switch in a form that has a Save button. That is a Checkbox.
- Don't use it to remove something. Removal is a `danger` Button and a Dialog.
