# Accordion

Questions that open to show their answers: the storefront FAQ.

A `border-thick` `ink` rule on top, a `line` hairline under each question. The question is `title`-sized Archivo, sentence case, with a small edged mark that inverts on hover and turns its caret when the answer is open. The answer is `body` in `ink-muted`, at most 70 characters wide.

## You provide

- `items`: `{ id, title, content }` for each question. Put each paragraph of an answer in its own `<p>`.
- `headingLevel`: the level that fits the page, `3` by default under a section's `h2`.
- `defaultOpen`, or `open` with `onOpenChange`, to start with answers open or to control them.

## Behavior

- Each question is a real button with `aria-expanded`, tied to its answer with `aria-controls` and `aria-labelledby`. Enter and Space open and close it; Up, Down, Home and End move between questions.
- Several answers can be open at once, so a visitor can compare them.
- A closed answer is `inert`: out of the tab order and out of the reading order.
- Opening runs on `duration-overlay` with `ease-in-out`. Under `prefers-reduced-motion` it opens at once and the caret flips without turning.
- Until the accordion runs in the browser, every answer shows. If the script is slow or never loads, the text is still there.
- With six questions or fewer, each answer is a `region`. With more, the regions are left out so the landmark list stays short.

## Don't

- Don't put a form or a primary action inside an answer.
- Don't render HTML from the database into `content`. Split plain text into paragraphs.
- Don't use it to hide something a visitor needs to act on. That stays on the page.
