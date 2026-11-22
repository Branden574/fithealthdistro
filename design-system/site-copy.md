# Site copy

The text the storefront ships with, slot by slot. The admin’s Site content page edits these, and Restore original puts back what is written here. The same list is in `site-copy.json`, which seeds the content store.

- Every heading, paragraph, button label and note on the storefront is a slot with a key. Read it from the content store; never type it into a page.
- Product names, descriptions and prices are not slots. They are edited under Products, and category names under Categories.
- Max is the longest the text can run before it breaks the layout it sits in. The editor warns past it and does not block typing.
- New text follows the Voice rules: short, verb first, no exclamation marks. Type it in sentence case; the capitals come from CSS.

| Slot | Where | Original text | Max |
| --- | --- | --- | --- |
| `nav.cta` | All pages · Navigation · Quote button | Request a quote | 22 |
| `nav.label` | All pages · Navigation · Menu name for screen readers | Main | 24 |
| `nav.contact` | All pages · Navigation · Contact link | Contact | 16 |
| `nav.faq` | All pages · Navigation · FAQ link | FAQ | 16 |
| `nav.menu.open` | All pages · Navigation · Open menu, for screen readers | Open menu | 24 |
| `nav.menu.close` | All pages · Navigation · Close menu, for screen readers | Close menu | 24 |
| `a11y.skip` | All pages · Navigation · Skip link | Skip to content | 32 |
| `meta.title` | All pages · Search results · Site title | Fit Health Distribution | 60 |
| `meta.description` | All pages · Search results · Site description | Vending machines, fitness supplements and drinks. Tell us what you need and we will send you a quote. | 160 |
| `home.hero.eyebrow` | Home · Hero · Eyebrow | Fit Health Distribution | 40 |
| `home.hero.headline` | Home · Hero · Headline | Stock what moves. | 28 |
| `home.hero.highlight` | Home · Hero · Highlighted words | moves. | 14 |
| `home.hero.lead` | Home · Hero · Intro paragraph | Vending machines, fitness supplements and drinks. Tell us what you need and we will send you a quote. | 160 |
| `home.hero.primary` | Home · Hero · Main button | Request a quote | 22 |
| `home.hero.secondary` | Home · Hero · Second button | Browse the catalog | 22 |
| `catalog.eyebrow` | Catalog · Heading · Eyebrow | Catalog | 24 |
| `catalog.heading` | Catalog · Heading · Heading | In the catalog | 28 |
| `catalog.filter.all` | Catalog · Filters · All filter | All | 12 |
| `catalog.card.cta` | Catalog · Product card · Button | I'm interested | 18 |
| `catalog.card.added` | Catalog · Product card · Button, once pressed | Added | 12 |
| `catalog.card.unavailable` | Catalog · Product card · Button, out of stock | Unavailable | 14 |
| `catalog.card.sample` | Catalog · Product card · Sample badge | Sample | 12 |
| `catalog.empty.title` | Catalog · No results · Title | No products match | 28 |
| `catalog.empty.body` | Catalog · No results · Message | Try another category, or tell us what you are looking for. | 120 |
| `catalog.filter.label` | Catalog · Filters · Filter group, for screen readers | Filter by category | 40 |
| `catalog.card.added.announce` | Catalog · Product card · Added, for screen readers | {name} is in your request. | 80 |
| `catalog.card.removed.announce` | Catalog · Product card · Removed, for screen readers | {name} is out of your request. | 80 |
| `request.title` | Contact · Your request · Title | Your request | 28 |
| `request.count.one` | Contact · Your request · Count, one product | 1 product in your request | 40 |
| `request.count.other` | Contact · Your request · Count, several products | {count} products in your request | 40 |
| `request.empty` | Contact · Your request · Nothing added yet | Nothing added yet. Press I'm interested on a product to add it here. | 120 |
| `request.remove` | Contact · Your request · Remove button | Remove | 16 |
| `request.remove.label` | Contact · Your request · Remove, for screen readers | Remove {name} from your request | 60 |
| `faq.eyebrow` | Home · FAQ · Eyebrow | Questions | 24 |
| `faq.heading` | Home · FAQ · Heading | Asked often | 28 |
| `faq.body` | Home · FAQ · Intro paragraph | Answers to what clients ask us most. Ask anything else in the form below. | 160 |
| `contact.eyebrow` | Contact · Heading · Eyebrow | Contact | 24 |
| `contact.heading` | Contact · Heading · Heading | Tell us what you need | 28 |
| `contact.body` | Contact · Heading · Intro paragraph | Pick products in the catalog or describe what you are after. We reply with a quote. | 160 |
| `contact.privacy` | Contact · Heading · Privacy line | Your details go to our team and nowhere else. | 80 |
| `contact.form.name` | Contact · Form · Name label | Name | 24 |
| `contact.form.company` | Contact · Form · Company label | Company | 24 |
| `contact.form.email` | Contact · Form · Email label | Email | 24 |
| `contact.form.phone` | Contact · Form · Phone label | Phone | 24 |
| `contact.form.interest` | Contact · Form · Interest label | I am interested in | 32 |
| `contact.form.interest.placeholder` | Contact · Form · Interest placeholder | Choose one | 24 |
| `contact.form.message` | Contact · Form · Message label | Message | 24 |
| `contact.form.message.hint` | Contact · Form · Message hint | How many, where they are going, and when you need them. | 80 |
| `contact.form.submit` | Contact · Form · Send button | Send request | 22 |
| `contact.success.title` | Contact · After sending · Confirmation title | Request sent | 28 |
| `contact.success.body` | Contact · After sending · Confirmation message | Thanks. We will reply by email with a quote. | 120 |
| `contact.error.title` | Contact · After sending · Error title | Your request was not sent | 40 |
| `contact.error.body` | Contact · After sending · Error message | Check the fields marked below, then send it again. | 120 |
| `contact.form.interest.several` | Contact · Form · Interest option, several | More than one | 32 |
| `contact.form.trap` | Contact · Form · Spam trap label, never seen | Leave this field empty | 40 |
| `contact.form.submitting` | Contact · Form · Send button, while sending | Sending | 22 |
| `contact.error.name` | Contact · Errors · Name missing | Enter your name. | 80 |
| `contact.error.email` | Contact · Errors · Email missing or wrong | Enter an email address we can reply to. | 80 |
| `contact.error.phone` | Contact · Errors · Phone wrong | Enter a phone number, or leave it empty. | 80 |
| `contact.error.interest` | Contact · Errors · Interest missing | Choose what you are interested in. | 80 |
| `contact.error.long` | Contact · Errors · Field too long | Keep this to {max} characters or fewer. | 80 |
| `contact.error.rate.title` | Contact · Errors · Too many requests, title | Too many requests | 40 |
| `contact.error.rate.body` | Contact · Errors · Too many requests, message | Wait a few minutes, then send it again. | 120 |
| `contact.error.server.title` | Contact · Errors · Server problem, title | We could not send your request | 40 |
| `contact.error.server.body` | Contact · Errors · Server problem, message | Nothing you did. Wait a minute, then send it again. | 120 |
| `footer.copyright` | All pages · Footer · Copyright line | © {year} Fit Health Distribution | 60 |
| `footer.email` | All pages · Footer · Email label | Email | 16 |
| `footer.phone` | All pages · Footer · Phone label | Phone | 16 |
