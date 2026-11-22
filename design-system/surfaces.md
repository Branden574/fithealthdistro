# Storefront and admin

How the components go together on the two surfaces Fit Health Distribution needs.

## Storefront

A client finds a product and asks for a quote.

- Open every page on the dark NavBar: the three categories, Contact, and one `primary` "Request a quote" Button.
- Hero: a `data-theme="dark"` band, `space-24` tall. One `display-xl` headline with one word under the highlighter, one `lead`, two `lg` Buttons.
- Catalog: Chips filter by category. ProductCards sit four across at full width, down to one on a phone. Vending machines come first, then supplements, then drinks.
- Each card's button reads "I'm interested" and adds the product to the request the client is building. Show the running request beside the contact form in a RequestList ("3 products in your request"), not in a cart.
- Contact form: Name, Company, Email, Phone, what they are interested in, and a message, on `bg-raised` inside `container-narrow`. One `primary` `lg` Button, "Send request". After it is sent, replace the form with a `success` Alert that says what happens next.
- Say plainly where the details go: a `caption` line with the `lock-simple` glyph beside the form.
- When online ordering is switched on, keep the cards and set `ctaLabel` to "Add to cart". Amounts in the cart and at checkout are `data`, and the pay Button is that page's one `primary`.

## Admin

The owner keeps the catalog current, rewrites the site's text, answers clients and sees whether they come back.

- Layout: the Sidebar in the first column, the page on `bg-subtle` with `space-8` padding. The page title is `display-md`, with the page's one `primary` Button at its right.
- Only signed-in admins reach an admin page. Client contact details are loaded on the server for admins and never appear on the storefront.

### Products

- A flush Panel with Tabs (All products, each category, Hidden) over a DataTable: Product, SKU, Category, Price, Stock, In catalog, actions.
- Add: the `primary` "Add product" Button opens an `md` Dialog with name, category, price, SKU, description, photo and "Show in catalog". Confirm with a `success` Alert.
- Hide: the In catalog Switch takes a product off the storefront at once and keeps everything about it. Prefer hiding to removing.
- Remove: the row's trash Button opens an `sm` Dialog that names the product and says that inquiries mentioning it are kept. The confirming Button is `danger`.

### Dashboard

- Four StatCards: Active clients, Client retention, New inquiries, Products live. Highlight retention.
- Retention is the share of the previous period's clients who are still active in this one. Write that definition in the Panel's description wherever the number appears, and always name the period.
- One Panel holds the retention BarChart by month, with the latest month in volt.

### Site content

The owner changes any text on the storefront without touching code.

- One page, Site content, under Website in the Sidebar. Tabs split the slots by page: Home, Catalog, Contact, All pages.
- Each section of a page is a Panel (Hero, Heading, Form). Each slot in it is a ContentField, two to a row, with paragraphs full width.
- `site-copy.md` lists every slot with its key, original text and length limit. The storefront reads each one from the content store and never has text typed into a page.
- Editing makes a draft. Clients see nothing new until "Publish changes", the page's one `primary` Button, which counts what it will publish. A `warning` Alert above the Tabs counts unpublished changes and offers Discard.
- A field that differs from what clients see is marked Unpublished. One that is published but differs from the original is marked Edited, shows the original wording, and offers Restore original.
- Past its limit a field shows an error, and Publish is disabled until it is fixed.
- "Preview site" opens the storefront with the draft text.

### Inquiries

- A list of InquiryCards, newest first, with `new` above the rest. Tabs split New, Read and Replied, and the Sidebar shows the count of new ones.
- Opening an inquiry marks it read. Reply opens a mail to the client; mark it replied once sent.
- With no inquiries, show an EmptyState with the `tray` glyph.
