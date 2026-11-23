# Logos

The Fit Health Distributing logo as SVG. They were traced from the logo Ryan supplied (a screenshot); replace them, keeping the file names, when the designer's vector file arrives, and update `components/src/logo-paths.ts` to match.

- `fhd-logo.svg`: the whole logo, letters in charcoal `#2a2e34` and the D and speed lines in orange `#e7511e`, for light grounds.
- `fhd-logo-white.svg`: the same with white `#ffffff` letters, for dark grounds and photos.
- `fhd-mark.svg` and `fhd-mark-white.svg`: FHD alone, for spots too tight for the whole logo.
- `fhd-icon.svg`: the orange lightning-bolt D on a charcoal tile. The favicon and app icon; the whole logo is too wide to read at that size.

Each file has fixed colors; an `<img>` cannot recolor it. In a page, use the Logo component, which follows the theme.

Keep clear space around the logo of at least the height of its FHD line. Nothing smaller than 32px tall; below that, use the mark.
