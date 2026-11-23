# Logo

The Fit Health Distributing logo: FHD with the lightning-bolt D, over FIT HEALTH, over DISTRIBUTING between two speed lines.

## You provide

Nothing is required.

- `height` in px; the width follows. 40 in the NavBar, 36 in the Sidebar, 48 on the sign-in page, 64 in the footer.
- `variant="mark"` gives FHD alone, for spots too tight for the whole logo. It is still about four times wider than tall.
- `title` is its accessible name, "Fit Health Distributing" unless you say otherwise. Pass `''` when the name is written out beside it.

The letters take the current text color, so they are `ink` on light and near-white on a dark band with no extra work. The D and the speed lines are always the brand orange, `accent`.

## Files

Where the component cannot run (a favicon, an email, a social image) use the SVGs in `assets/Logos`.

## Don't

- Don't recolor the letters orange or the D anything but orange, and don't stretch it, outline it or add a shadow.
- Don't put anything within the height of the FHD line of it.
- Don't set it below 32px tall: DISTRIBUTING stops being readable. Use `variant="mark"` instead.
- Don't use the whole logo as a favicon or app icon. It is too wide to read at that size; use `fhd-icon.svg`.
