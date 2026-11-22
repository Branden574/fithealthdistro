Fit Health Distribution sells vending machines first, and fitness supplements and drinks alongside them. This system covers its two surfaces: the storefront, where clients browse the catalog and ask for a quote, and the admin, where the owner manages products, edits the site's text, reads inquiries and watches client retention. The look is bold and athletic: near-black, white and one volt accent, heavy condensed capitals, tight corners, borders instead of shadows.

## Voice

- Write short, direct sentences. Lead with the verb: "Request a quote", "Add product", "Tell us what you need".
- Call the client "you" and the company "we". In the admin, "you" is the owner.
- A headline is a few words in capitals, with a full stop when it is a statement: "STOCK WHAT MOVES."
- Everything outside the display styles is sentence case: product names, labels, table cells. Type button labels in sentence case too; the capitals are CSS.
- Numbers are digits with their units: "40 selections", "case of 12", "$4,250".
- No exclamation marks, no emoji, no hype ("best", "#1"). Make no health claims about supplements; say what is in the tub.
- Say what happens next: "We reply with a quote." "Inquiries that mention it are kept."
- An error says how to fix it: "Give it a name and a category, then save again."
- There is no online checkout yet. The client's action is "I'm interested" or "Request a quote", never "Buy now".
- The storefront's wording is the owner's to change in the admin. `site-copy.md` holds the text it ships with; treat that as the default, and apply these rules to anything new.

## Color

Two themes, `light` first, then `dark`. Pages default to light. Put `data-theme="dark"` on a band to turn it near-black: the NavBar, the hero, the footer and the Sidebar all do.

- Text is `ink` on `bg`. Use `bg-subtle` for quiet bands and the admin canvas, and `bg-raised` for cards on either. Secondary text is `ink-muted`. Keep `ink-faint` for placeholders and timestamps.
- Volt is `accent`, and it is a fill. Text and icons on it are `on-accent`, which is ink, never white. Use it for the one primary Button in a view, checked boxes and switches, the current Sidebar item, the highlighted chart bar, and the highlighter behind one key word or number (the `fhd-mark` class).
- Volt cannot hold a line or text on white. Wherever the accent has to be a line, a small mark or text, use `accent-ink`: ink on light, volt on dark. It edges every volt control, underlines the current tab and nav link, and colors links.
- Keep volt under about a tenth of any view. If two things in a view are volt, one of them is wrong.
- Hairlines are `line`. Control edges are `line-strong` at rest and `ink` on hover and focus.
- Status is `success` (teal), `warning` (amber), `danger` (red-orange) and `info` (blue), each with a `-soft` fill. Status always comes with a word, and in an Alert with an icon: In stock, Low stock, Out of stock, Draft. Success is teal so it is never mistaken for volt, and so success and danger stay apart for red-green color blindness.
- Keyboard focus is the `focus-ring` shadow on every control: a 2px gap in the page color, then 2px of `focus`.

## Type

Three families, shipped in `fonts/`.

- Big Shoulders (`font-display`) for display: `display-xl` to `display-sm`, `stat`, `action`, `action-sm`. Always uppercase, weights 800 and 900 only, never under 13px. One `display-xl` per page.
- Archivo (`font-sans`) for everything people read: `lead`, `title`, `body`, `body-sm`, `label`, `eyebrow`, `caption`. Sentence case, except `eyebrow`, which is uppercase with wide tracking.
- Chivo Mono (`font-mono`) for what people compare digit by digit: `data` and `data-sm` for SKUs, prices in tables, phone numbers, email addresses and chart ticks.
- A product name is `title`, never a display style. A price on a card is `display-sm`; a price in a table is `data`.
- No italics. Emphasis is weight 600 or 700, or the highlighter.

## Space, corners, borders

- Space on the 4px scale, `space-1` to `space-24`. Cards pad `space-4` or `space-5`, grids gap `space-6`, storefront sections pad `space-20` top and bottom.
- Corners are tight: `radius-sm` (2px) on controls, `radius-md` (4px) on cards and dialogs, `radius-lg` (8px) on large photos only. `radius-full` is for switches, dots and count pills, never buttons.
- Borders do the work shadows do elsewhere. `border-thin` hairlines outline cards. `border-thick` edges every button and sits under table headers. `border-heavy` is the 4px rule on stat cards, under the current tab and beside the selected row.
- The system is flat. Only things that float take a shadow: `shadow-pop` on menus, `shadow-overlay` on dialogs.
- Storefront content sits inside `container`. Forms and long copy sit inside `container-narrow`.

## States and motion

- Hover deepens or inverts: an outline Button fills with `ink`, volt goes to `accent-hover`, a card's edge goes from `line` to `ink`.
- Disabled is the whole control at `opacity-disabled`, with no change of hue.
- Motion is short and plain, and every value is a `motion` token. Nothing bounces, nothing loops for decoration, and nothing is tied to the scroll position.
  - Feedback (hover, press, selection) is `duration-feedback`, 120ms, on `ease-out`.
  - Menus, dialogs, accordions and alerts arrive on `duration-overlay`, 200ms, with `ease-enter`, and leave quicker on `duration-exit`.
  - The hero's lines rise `motion-shift` into place once on load (`fhd-enter`), staggered by `stagger-step` and never more than `stagger-max`.
  - A section fades in the first time it scrolls into view (`data-reveal`). Fade only: it does not travel.
  - A list that is replaced in answer to the visitor, such as the catalog after a filter, appears item by item (`fhd-appear-list`), capped at `stagger-max`.
  - A product photo may lean in to `motion-scale-media` on hover, inside the card's edge, on pointer devices only.
- Move only opacity and transform. The one exception is an accordion answer opening, which has to change the layout.
- Content is visible without motion. An entrance must never be the only way something becomes visible, and a control never waits for an animation to finish.
- Keyboard focus shows at once, with no transition on the ring.
- Honor `prefers-reduced-motion`: distance, scale and stagger fall to zero and entrances are skipped. State changes still show.

## Imagery

- Product photos are 4:3, shot straight on against a plain ground and cropped to fill. No lifestyle stock photos, no gradients, no illustrations.
- Until a product has a photo, show its category glyph on `bg-subtle`, as ProductCard does.

## Icons

- Phosphor Icons, Bold weight only, through the Icon component or the files in `assets/Icons`. 16px in small controls, 20px by default, 24px standing alone.
- The category glyphs are `lockers` for vending machines, `jar-label` for supplements and `drop` for drinks. Phosphor has no vending machine; `lockers` is the closest cabinet and stands in for one.
- An icon takes the text color of its parent. No emoji, and no second icon family.

## Logo

There is no logo yet. The name is set in plain type: the Wordmark component in a page, the outlined files in `assets/Logos` where the font cannot load. The wordmark is always capitals, FIT HEALTH DISTRIBUTION, in `ink` on light and white on dark, never volt. The FHD monogram tile is for favicons and avatars. When a real logo exists, replace those files and pass the image to `brand` on the NavBar and Sidebar.

## The two surfaces

`surfaces.md` says how the components go together on the storefront and in the admin. `site-copy.md` lists every piece of storefront text with its key and its original wording. The Storefront, AdminDashboard and SiteContent pages show each surface built.
