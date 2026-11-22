# ContentField

One piece of website text in the admin's Site content page: edit it, see that it changed, put the original back.

It wraps a TextField with the slot's location as an eyebrow, a status Badge, a character count in Chivo Mono and, once the text differs from the original, the original wording beside a Restore original Button.

## You provide

- `label` and `location`: what the text is and where it shows ("Headline", "Home · Hero").
- `value` and `onChange`, which receives the new text.
- `original`: the text the site shipped with, from `site-copy.json`.
- `published`: the text clients see now. Leave it out if edits go live as they are typed.
- `maxLength`: the slot's limit. Past it the count turns `danger` and the field shows an error. Typing is not blocked.
- `multiline` for paragraphs, and `hint` for how the text is used.

## States

- Unpublished, a `warning` Badge: `value` differs from `published`.
- Edited, a neutral Badge: published, but different from the original.
- No Badge: the original text.

## Layout

Two to a row inside a Panel on a `space-5` gap. Paragraphs take the full row.

## Don't

- Don't use it for product names, descriptions or prices. Those are edited under Products.
- Don't refuse to publish without saying why. A field that is too long says so itself.
