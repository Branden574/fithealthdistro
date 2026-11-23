# BarChart

Vertical bars over time: client retention by month, inquiries by week.

Bars are `ink`. One bar, the period that matters, is volt with an `accent-ink` edge; by default it is the last. The baseline is a `border-thick` `ink` rule and the two guides are dashed `line` hairlines. Ticks and values are Chivo Mono.

## You provide

- `data`: 4 to 12 points of `label` and `value`, oldest first. A `value` of `null` means there was nothing to measure that period: it draws a dash on the baseline and is read out as `emptyLabel` ("no data" unless you say otherwise). Never stand in a 0 for a period that has no figure.
- `ariaLabel`: one sentence that says what the chart shows. The values are read out after it.
- `unit`: appended to values and scale labels. With "%" the scale runs 0 to 100.
- `format`: writes a value as text where a unit is not enough, such as dollars ("$1,250"). It is used for the values, the scale and the read-out. The middle of the scale is half the top, so a small top can land on a half ($2.50 when the top is $5): keep the decimals the format needs rather than rounding them away.
- `max`: the top of the scale, when the default does not suit. When every value is zero and no `max` or "%" sets the top, only the baseline is labelled: there is no scale to read.
- `showValues` to print each value above its bar. Use it for 8 bars or fewer.
- `highlight`: the index of the volt bar, or -1 for none. `height` for the plot in px.

## Motion

Bars rise into place once when the chart first shows, staggered by `stagger-step` up to `stagger-max`, and slide to new heights on `duration-enter` when the data changes, with their values riding along. Only transform and opacity move: each bar fills its column inside a clipped track. Under reduced motion the bars are simply there.

## Where it goes

Inside a Panel whose title names the measure and whose description defines it.

## Don't

- Don't color bars by value or use more than one volt bar.
- Don't use it to compare things with long names. That is a DataTable sorted by the number.
