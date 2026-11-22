# NavBar

The storefront's top bar: the wordmark, the section links and the quote button.

It is dark by default (`theme="dark"`), so every storefront page opens on a near-black band. The current link is `ink` over a `border-heavy` rule in `accent-ink`. Under 760px the links fold into a menu button.

## You provide

- `links`: three to five, each with `id`, `label` and `href`. Here: Vending machines, Supplements, Drinks, Contact.
- `current`: the `id` of the page being shown.
- `actions`: one `primary` `sm` Button, "Request a quote".
- `onNavigate` if your router handles the click. `brand` once there is a logo image to show in place of the wordmark.

## Don't

- Don't add a second row or a dropdown. If there are more than five links, the catalog needs categories, not the nav.
- Don't use it inside the admin. The admin has the Sidebar.
