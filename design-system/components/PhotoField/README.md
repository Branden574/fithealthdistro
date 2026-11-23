# PhotoField

Choose, replace or remove one photo. The admin uses it for a product's picture.

A 4:3 frame, the same shape the catalog crops to, shows the current photo or an empty `image` glyph on `bg-subtle`. Beside it sit an `outline` `sm` Button that opens the file picker ("Choose a photo", then "Replace photo") and, once there is a photo, a `ghost` "Remove photo". The hint and error sit under the buttons, as on TextField.

## You provide

- `label`, and `hint` for what to pick: the types, the size limit and the shape it is shown at.
- `src`: the photo to show, or nothing.
- `onSelect(file)`: check the file's type and size, then upload it. The picker's `accept` filter is only a convenience; the storage bucket enforces the real limits.
- `onRemove` to offer removal.
- `busy` while it uploads. The button waits and the frame says "Uploading".
- `error` for what went wrong and what to do ("Pick a JPEG, PNG or WebP photo up to 5 MB.").

## Layout

Full width in a form, on its own row. The frame keeps its size; the buttons and text wrap under it on a narrow dialog.

## Don't

- Don't upload on the form's Save. Upload when the file is picked, so Save is quick and an upload error shows next to the photo.
- Don't stretch or letterbox the preview. It crops like the catalog card, so the admin sees what clients will see.
