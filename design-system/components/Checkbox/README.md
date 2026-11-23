# Checkbox

A yes or no inside a form, and the row selector in a DataTable.

Checked is an orange fill (`accent`) with an ink tick (`on-accent`) and an `accent-ink` edge. Unchecked is a `line-strong` box that turns `ink` on hover.

## You provide

`label`, which is clickable, or an `aria-label` when there is no visible text (a table row). `hint` adds a quieter second line. `indeterminate` shows a dash for "some, not all": the select-all box when part of a table is selected.

`error` puts a message under the box, edges the box in `danger` and ties the message to it for screen readers: a required agreement left empty ("Agree to the terms to send your request.").

Several boxes that answer one question go in a CheckboxGroup.

## Use it for

- Choices that are saved with the rest of a form: "Featured product", "Send me a copy of my request".
- Agreement and consent on a form. Never tick a consent box for the visitor, and keep each consent in its own box.
- Selecting rows to act on together.

## Don't

- A setting that takes effect the moment it is flipped is a Switch.
- Don't use a checkbox for one-of-many. That is a Select or Chips.
