# Alert

A message in the flow of the page: a save confirmed, stock running low, a form that failed.

Each tone is a soft fill with an edge and an icon in the status color; the text stays `ink`. The icon and the title make the tone readable without color.

## You provide

- `tone`: `success`, `warning`, `danger`, `info` or `neutral`.
- `title`, a bold first line that says what happened, and one sentence of body as children.
- `action` for one small button ("Review", "Undo"); `onDismiss` to let the admin close it.

`danger` and `warning` are announced immediately to screen readers; the others politely.

## Where it goes

At the top of the form or panel it is about, full width, above the content.

## Don't

- A problem with one field is that field's `error`, not an Alert.
- Don't stack more than two. Fix the cause or merge the messages.
- Don't use an Alert for a decision. That is a Dialog.
