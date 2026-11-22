# TextField

A labelled text input or textarea with a hint and an error.

The edge is `line-strong` at rest and `ink` on hover and focus, with the `focus-ring` outside it. An error turns the edge to `danger` and prints the message under the control with an icon, so it never depends on color alone.

## You provide

- `label`, always, in sentence case. A placeholder is not a label. Use `hideLabel` only where the context already names the field, such as a search box.
- The value: `value` with `onChange`, or `defaultValue`.
- `hint` for what to type; `error` for what went wrong and how to fix it ("This SKU is already in use.").
- `prefix` and `suffix` for units: `$` before a price, `per unit` after it. Set `inputMode="decimal"` on prices.
- `multiline` with `rows` for descriptions and the contact message.

## Layout

Two fields to a row at most, on a `space-5` gap. Keep a form inside `container-narrow`.

## Don't

- Don't write errors as blame ("Invalid input"). Say what to do.
- Don't mark optional fields; mark required ones with `required`.
