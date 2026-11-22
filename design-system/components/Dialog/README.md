# Dialog

A modal for one decision or one short form: confirm a removal, add a product.

A `bg-raised` panel with a `border-thick` `ink` outline and `shadow-overlay`, over the `scrim`. Focus moves into it and stays there; Escape, the close button and a click on the scrim call `onClose`, and focus returns to where it was.

## You provide

- `open` and `onClose`.
- `title`: the decision as a question ("Remove this product?") or the task ("Add product").
- `description`: what will happen, in one or two sentences, including what is kept.
- `footer`: the buttons, right-aligned. The way out first as an `outline` Button ("Keep it"), the action last. A removal uses `danger`.
- Children for a form. `size` is `sm` for confirmations, `md` for forms.

`contained` keeps the dialog inside its positioned parent and leaves focus alone. It exists for documentation.

## Don't

- Don't label the buttons Yes and No. Say what each one does.
- Don't use a dialog to say something worked. That is an Alert.
- Don't open a dialog from a dialog.
