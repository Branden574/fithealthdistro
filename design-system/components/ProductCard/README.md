# ProductCard

One product in the catalog: photo, name, price and the button a client presses to ask about it.

## You provide

- `name` in sentence case and `category` (Vending machines, Supplements, Drinks).
- `image`, shown 4:3 and cropped to fill. Until there is a photo the card shows the category glyph through `icon`: `lockers` for machines, `jar-label` for supplements, `drop` for drinks.
- `price`: a number is formatted as US dollars; a string is shown as given ("Call for price"). Leave it out to hide the price. `priceNote` qualifies it ("starting at", "per case").
- `description`: one or two lines. It is clamped to two.
- `badges`: at most two, over the photo.
- `onInterest`, and `selected` once the client has added the product to their request.

## The button

There is no checkout yet. The button reads "I'm interested" and adds the product to the request the client sends through the contact form; once pressed it turns `solid` and reads "Added". When online ordering is switched on, the same slot takes `ctaLabel="Add to cart"`.

`unavailable` fades the photo and disables the button. Pair it with an "Out of stock" badge so the reason is written down.

## Layout

A grid of `repeat(auto-fill, minmax(220px, 1fr))` on a `space-6` gap. Cards in a row share a height; the price and button stay at the bottom.

## Don't

- Don't write the name in capitals.
- Don't show a price of $0. Omit it or say "Call for price".
