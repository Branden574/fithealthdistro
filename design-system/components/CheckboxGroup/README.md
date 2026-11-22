# CheckboxGroup

Several boxes answering one question, any number of them ticked: "I am interested in" on the contact form.

A real `fieldset` with a `legend` set like a field label, so a screen reader reads the question with each box. The hint sits under the legend, the boxes stack under it on `space-3`, and an error sits under the boxes, as on a TextField.

## You provide

- `legend`: the question, sentence case.
- `hint`: what to do, such as "Tick everything that applies."
- `required` to show the asterisk, and `error` when nothing was ticked. Say what to do: "Tick at least one thing you are interested in."
- Checkboxes as children. A box can open a nested group under it.

## Nested groups

`nested` hangs a group off the box above it, behind a `line-strong` hairline at the box's centre, and it arrives on `duration-overlay` (at once under reduced motion). Use it for the products of a ticked category. Give a nested group a `legend` that names its parent ("Vending machines products") and `hideLegend`, because the box above already says it on screen.

## Don't

- One choice from several is a Select or Chips.
- Don't tick boxes the visitor did not tick, except to show what they already picked elsewhere (a product added from the catalog).
