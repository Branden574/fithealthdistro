# Gallery

A product's photos on its own page: one at a time in the same 4:3 frame, with thumbnails under it.

A `radius-lg` frame on `bg-subtle` with a `line` hairline, like the single photo it replaces. With two or more photos it adds `solid` arrow buttons at the sides, a `2 / 5` counter in Chivo Mono on `ink` in the corner, and a row of 72px thumbnails. The thumbnail in view gets an `accent` edge. With one photo it is just the frame; with none it shows `placeholder`, the category's glyph.

## Moving between photos

The track scroll-snaps, so a swipe on a phone, a trackpad scroll, the arrow buttons, a thumbnail, or the arrow, Home and End keys (with the frame focused) all land on exactly one photo. Past either end the arrows come round to the other end, so the button under the pointer never goes dead. It never moves by itself.

It glides between photos, and under reduced motion it jumps. Screen readers hear "Photo 2 of 5" each time the visitor moves it, not on load.

## You provide

- `photos`: `{ src, alt }` in the owner's order. The first is the cover the catalog card shows. Leave `alt` empty when the page's heading already names the product.
- `label`: what the carousel is, "Photos of Combo vending machine".
- `previousLabel`, `nextLabel` and `photoLabel` for the storefront's own copy. `photoLabel` is a template, "Photo {number} of {total}", so a server component can pass it.
- `dimmed` for a product that is out of stock, as the catalog card fades its photo.

## Don't

- Don't autoplay it. People read specs beside it.
- Don't mix crops: every photo shows at 4:3, cropped to fill. Shoot with the product in the middle.
