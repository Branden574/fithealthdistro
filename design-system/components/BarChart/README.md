# BarChart

Vertical bars over time: client retention by month, inquiries by week.

Bars are `ink`. One bar, the period that matters, is volt with an `accent-ink` edge; by default it is the last. The baseline is a `border-thick` `ink` rule and the two guides are dashed `line` hairlines. Ticks and values are Chivo Mono.

## You provide

- `data`: 4 to 12 points of `label` and `value`, oldest first.
- `ariaLabel`: one sentence that says what the chart shows. The values are read out after it.
- `unit`: appended to values and scale labels. With "%" the scale runs 0 to 100.
- `showValues` to print each value above its bar. Use it for 8 bars or fewer.
- `highlight`: the index of the volt bar, or -1 for none. `height` for the plot in px.

## Where it goes

Inside a Panel whose title names the measure and whose description defines it.

## Don't

- Don't color bars by value or use more than one volt bar.
- Don't use it to compare things with long names. That is a DataTable sorted by the number.
