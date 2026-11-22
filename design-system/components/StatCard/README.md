# StatCard

One business figure for the admin dashboard, with its change and the period it is compared with.

The card carries a `border-heavy` `ink` rule along the top. The number is set in the `stat` style, its unit at half size.

## You provide

- `label`: what is counted, in two or three words ("Client retention").
- `value`, and `unit` where there is one ("%").
- `delta`: the change, written out ("+4 pts", "-3"), with a `direction`. Up is drawn as `success` and down as `danger`; set `tone` yourself when down is the good direction.
- `helper`: the comparison period ("vs. last quarter"). A delta without one means nothing.
- `trend`: up to 12 recent values, drawn as small bars with the last in volt.

## Emphasis

- `highlight` puts the volt highlighter behind the number. One per row: the figure the owner checks first, which here is client retention.
- `tone="inverse"` paints the card near-black with a volt rule. At most one per page.

## Layout

Four across on a `space-4` gap; two across under 900px.

## Don't

- Don't put a sentence in a stat card. A number, a label, a change.
- Don't show a figure without saying how it is worked out somewhere on the page. Retention here means the share of last period's clients who are still active.
