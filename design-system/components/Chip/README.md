# Chip

A filter toggle: the category filters above the catalog and the status filters above an admin list.

A selected chip is an `ink` fill with a `bg` label; an idle one is a `line-strong` outline that turns `ink` on hover. The count sits after the label in Chivo Mono.

## You provide

The label, the `selected` state and the click handler. Chip keeps no state of its own, so one-of-many and any-of-many are both yours to decide. Wrap a set in an element with `role="group"` and an `aria-label` such as "Filter by category".

## Use it for

- Category filters: All, Vending machines, Supplements, Drinks, each with its glyph (`lockers`, `jar-label`, `drop`).
- Short option sets of two to five that change what a list shows.

## Don't

- Don't use a chip to show status. That is a Badge, which cannot be pressed.
- Don't use a chip to do something. That is a Button.
- More than five options: use a Select.
