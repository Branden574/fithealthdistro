# Icon

One Phosphor Bold glyph, drawn inline so it takes the current text color.

## You provide

`name`, one of the 67 glyphs listed in `Icon.names` and kept as files in `assets/Icons`. `size`: 16 inside small controls and beside 14px text, 20 by default, 24 standing alone. `label` only when the icon is the whole message; without it the icon is hidden from screen readers.

## The category glyphs

`lockers` for vending machines, `jar-label` for supplements, `drop` for drinks. Use them wherever a category appears without its name beside a photo.

## Adding a glyph

Take it from Phosphor's Bold weight, add its name to `scripts/icons.mjs` in the repository and run the script. Don't mix in another weight or another icon family.

## Don't

- Don't color an icon by hand. Set the text color of its parent with a token.
- Don't use an icon alone for an action without an `aria-label` on the button.
