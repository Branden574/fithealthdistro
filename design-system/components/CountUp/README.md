# CountUp

A number that counts to its new value when the value changes: a stat when the admin switches from 30 days to 90.

## You provide

- `value`: the number.
- `format`: turns the number into text, as it counts and at rest: dollars, a percentage, whole numbers. Defaults to whole numbers with thousands separators.

## Behaviour

- The first render shows the value as it is. Nothing counts up from zero on load: the page is readable at once.
- A change counts from what was showing to the new value over `duration-enter`, easing out. A change during a count carries on from where it had reached.
- Under reduced motion the new value shows at once.
- Screen readers get the final value only; the counting figures are hidden from them.
- Digits are tabular, so the figure keeps its width while it counts.

## Where it goes

Inside a StatCard's `value`, or anywhere a figure changes in place. Use it only for figures that change while the page is open.

## Don't

- Don't use it for a number that never changes on the page; it would never move.
- Don't count values that are not numbers, such as "—" for a period with nothing to measure. Show those as text.
