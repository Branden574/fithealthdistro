# PhotosField

Several photos for one product, in the order clients see them. The first is the cover: the catalog card, link previews and the first slide of the product page's Gallery.

Each photo shows in a 4:3 frame, the shape the storefront crops to, with an ink "Cover" Badge on the first. Under each frame sit three `ghost` `sm` icon Buttons: move earlier (`caret-left`), move later (`caret-right`) and remove (`trash`). Their labels name the photo ("Move earlier, Photo 2"). Under the list, an `outline` `sm` "Add photos" Button opens a picker that takes several files, beside a count ("3 of 8 photos"). The button goes once the list is full. The hint and error sit under it, as on TextField.

Moving a photo keeps the focus on the same button of the photo that moved. At either end, where that button is disabled, the focus falls back to the photo's remove button. Removing a photo moves the focus to the photo that took its place, or to the add button when none is left. A polite live region says what changed.

## You provide

- `label`, `hint` (types, size limit, the shape it is shown at) and `max`.
- `photos`: `{ key, src }` in order. `key` must stay the same while a photo moves; use its storage path.
- `onSelect(files)`: check each file's type and size, then upload them one after another. You get at most as many files as there is room for.
- `onMove(from, to)` and `onRemove(index)`: update your list.
- `busy` while uploads run, and `error` for what went wrong and what to do.

## Layout

Full width in a form, on its own row. The frames wrap into as many columns as fit, at least 128px each, so a phone-width dialog shows two.

## Don't

- Don't upload on the form's Save. Upload when the files are picked, so Save is quick and an upload error shows next to the photos.
- Don't drop the move buttons for drag only. Dragging is not available to keyboards or screen readers.
- Don't use it for one photo. Use PhotoField.
