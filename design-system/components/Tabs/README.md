# Tabs

Switches between views of one list. The selected tab carries the heavy rule.

Labels are uppercase Big Shoulders in `ink-muted`; the selected one is `ink` over a `border-heavy` rule in `accent-ink`, which is ink on light and volt on dark. A count sits in a pill after the label and turns volt on the selected tab.

## You provide

`items` (`id`, `label`, optional `count`), and either `value` with `onChange` or `defaultValue`. You render what the selected tab shows. `ariaLabel` names the set. Left and right arrows, Home and End move between tabs.

Give `panelId` and wrap what the tabs show in an element with that id, `role="tabpanel"` and `aria-labelledby` set to the selected tab's id, which is `` `${panelId}-tab-${selectedId}` ``. Screen readers then announce which view the panel is showing.

## Use it for

- Views of the product list: All products, each category, Hidden.
- Inquiries by state: New, Read, Replied.

## Don't

- Don't use tabs to move between pages. That is the Sidebar or the NavBar.
- More than six tabs: use a Select.
