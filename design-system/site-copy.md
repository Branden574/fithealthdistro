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
| `a11y.newtab` | All pages · Navigation · New tab, for screen readers | (opens in a new tab) | 32 |
| `meta.title` | All pages · Search results · Site title | Fit Health Distribution | 60 |
| `meta.description` | All pages · Search results · Site description | Vending machines, fitness supplements and drinks. Tell us what you need and we will send you a quote. | 160 |
| `meta.page.title` | All pages · Search results · Title of other pages | {name} \| Fit Health Distribution | 80 |
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
| `catalog.stock.out` | Catalog · Product card · Out of stock badge | Out of stock | 14 |
| `catalog.stock.low` | Catalog · Product card · Low stock badge | Low stock | 14 |
| `catalog.empty.title` | Catalog · No results · Title | No products match | 28 |
| `catalog.empty.body` | Catalog · No results · Message | Try another category, or tell us what you are looking for. | 120 |
| `catalog.filter.label` | Catalog · Filters · Filter group, for screen readers | Filter by category | 40 |
| `catalog.results.one` | Catalog · Filters · One result, for screen readers | 1 product shown. | 40 |
| `catalog.results.other` | Catalog · Filters · Results, for screen readers | {count} products shown. | 40 |
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
| `contact.form.interest.hint` | Contact · Form · Interests help | Tick everything that applies. Pick specific products if you know them. | 120 |
| `contact.form.products.label` | Contact · Form · Products under a category, for screen readers | {category} products | 60 |
| `contact.form.message` | Contact · Form · Message label | Message | 24 |
| `contact.form.message.hint` | Contact · Form · Message hint | How many, where they are going, and when you need them. | 80 |
| `contact.form.terms` | Contact · Form · Terms agreement | I agree to the {terms} and the {privacy}. | 120 |
| `contact.form.terms.link` | Contact · Form · Terms link | Terms of Use | 32 |
| `contact.form.privacy.link` | Contact · Form · Privacy link | Privacy Policy | 32 |
| `contact.form.marketing` | Contact · Form · Marketing email opt-in | Email me about products and offers from Fit Health Distribution. | 120 |
| `contact.form.marketing.hint` | Contact · Form · Marketing opt-in note | Optional. You can stop these emails at any time. | 80 |
| `contact.form.submit` | Contact · Form · Send button | Send request | 22 |
| `contact.success.title` | Contact · After sending · Confirmation title | Request sent | 28 |
| `contact.success.body` | Contact · After sending · Confirmation message | Thanks. We will reply by email with a quote. | 120 |
| `contact.error.title` | Contact · After sending · Error title | Your request was not sent | 40 |
| `contact.error.body` | Contact · After sending · Error message | Check the fields marked below, then send it again. | 120 |
| `contact.form.trap` | Contact · Form · Spam trap label, never seen | Leave this field empty | 40 |
| `contact.form.submitting` | Contact · Form · Send button, while sending | Sending | 22 |
| `contact.error.name` | Contact · Errors · Name missing | Enter your name. | 80 |
| `contact.error.email` | Contact · Errors · Email missing or wrong | Enter an email address we can reply to. | 80 |
| `contact.error.interests` | Contact · Errors · Nothing ticked | Tick at least one thing you are interested in. | 80 |
| `contact.error.terms` | Contact · Errors · Terms not agreed | Agree to the terms to send your request. | 80 |
| `contact.error.phone` | Contact · Errors · Phone wrong | Enter a phone number, or leave it empty. | 80 |
| `contact.error.long` | Contact · Errors · Field too long | Keep this to {max} characters or fewer. | 80 |
| `contact.error.rate.title` | Contact · Errors · Too many requests, title | Too many requests | 40 |
| `contact.error.rate.body` | Contact · Errors · Too many requests, message | Wait a few minutes, then send it again. | 120 |
| `contact.error.server.title` | Contact · Errors · Server problem, title | We could not send your request | 40 |
| `contact.error.server.body` | Contact · Errors · Server problem, message | Nothing you did. Wait a minute, then send it again. | 120 |
| `footer.copyright` | All pages · Footer · Copyright line | © {year} Fit Health Distribution | 60 |
| `footer.email` | All pages · Footer · Email label | Email | 16 |
| `footer.phone` | All pages · Footer · Phone label | Phone | 16 |
| `footer.legal.label` | All pages · Footer · Legal links, for screen readers | Legal | 24 |
| `footer.terms` | All pages · Footer · Terms link | Terms of Use | 24 |
| `footer.privacy` | All pages · Footer · Privacy link | Privacy Policy | 24 |
| `product.back` | Product · Navigation · Back to the catalog | All products | 24 |
| `product.specs.heading` | Product · Details · Specs heading | Specifications | 28 |
| `product.request.view` | Product · Details · Link to the request | See your request | 24 |
| `product.missing.title` | Product · Not found · Title | Not in the catalog | 28 |
| `product.missing.body` | Product · Not found · Message | This product is no longer listed. Browse what we have now. | 120 |
| `terms.title` | Terms · Page · Title | Terms of Use | 40 |
| `terms.updated` | Terms · Page · Last updated | Last updated November 22, 2026 | 60 |
| `terms.intro` | Terms · Page · Introduction | These terms cover your use of the Fit Health Distribution website. By using the site or sending us a request, you agree to them. If you do not agree, do not use the site. | 600 |
| `terms.s1.heading` | Terms · Part 1 · Heading | Quotes, not orders | 60 |
| `terms.s1.body` | Terms · Part 1 · Text | Nothing on this site is an offer to sell, and sending a request does not place an order. A request asks us for a quote. It does not commit you to buy or us to supply.

Prices, delivery, installation and any other terms of a sale are set out in the written quote we send you. An agreement is made only when you accept that quote. | 2000 |
| `terms.s2.heading` | Terms · Part 2 · Heading | Product information | 60 |
| `terms.s2.body` | Terms · Part 2 · Text | We work to keep descriptions, photos, specifications, prices and stock levels accurate, but they can change and may contain mistakes. Prices on the site are a guide until we confirm them in a quote.

We describe supplements and drinks by what they contain. Nothing on this site is medical advice. | 2000 |
| `terms.s3.heading` | Terms · Part 3 · Heading | Using the site | 60 |
| `terms.s3.body` | Terms · Part 3 · Text | Use the site lawfully and give us accurate details. Do not try to disrupt the site, get around its security, collect data from it automatically, or send requests in someone else's name. | 2000 |
| `terms.s4.heading` | Terms · Part 4 · Heading | Our content | 60 |
| `terms.s4.body` | Terms · Part 4 · Text | The text, photos and design of this site belong to Fit Health Distribution or are used with permission. Do not copy or reuse them commercially without our written permission. | 2000 |
| `terms.s5.heading` | Terms · Part 5 · Heading | Liability | 60 |
| `terms.s5.body` | Terms · Part 5 · Text | The site is provided as it is and as available. To the extent the law allows, we are not liable for any loss that comes from relying on information on the site or from the site being unavailable. Nothing in these terms limits any right you have by law. | 2000 |
| `terms.s6.heading` | Terms · Part 6 · Heading | Your details | 60 |
| `terms.s6.body` | Terms · Part 6 · Text | Our Privacy Policy explains what we collect when you send a request and how we use it. | 2000 |
| `terms.s7.heading` | Terms · Part 7 · Heading | Changes to these terms | 60 |
| `terms.s7.body` | Terms · Part 7 · Text | We may update these terms. The date at the top of this page shows when they last changed. The version that applies is the one shown here when you use the site. | 2000 |
| `terms.s8.heading` | Terms · Part 8 · Heading | Questions | 60 |
| `terms.s8.body` | Terms · Part 8 · Text | Questions about these terms? Use the contact details at the bottom of this page, or send us a message through the form on our home page. | 2000 |
| `privacy.title` | Privacy · Page · Title | Privacy Policy | 40 |
| `privacy.updated` | Privacy · Page · Last updated | Last updated November 22, 2026 | 60 |
| `privacy.intro` | Privacy · Page · Introduction | This policy explains what Fit Health Distribution collects through this website, why we collect it, and the choices you have. | 600 |
| `privacy.s1.heading` | Privacy · Part 1 · Heading | What we collect | 60 |
| `privacy.s1.body` | Privacy · Part 1 · Text | When you send a request we receive your name, your email address and what you are interested in, plus anything else you choose to give us: your company, phone number, message and the products you picked. We also record that you agreed to our terms and whether you asked for marketing emails, with the time and the wording you saw.

To block spam we keep a scrambled code made from your internet address, not the address itself, and use it only to stop repeated requests. | 2000 |
| `privacy.s2.heading` | Privacy · Part 2 · Heading | How we use it | 60 |
| `privacy.s2.body` | Privacy · Part 2 · Text | We use your details to answer your request: to prepare a quote, to reply to you, and to keep a record of what you asked for.

If you tick the box for marketing emails, we may also email you about our products and offers. We do not send them otherwise. You can stop them at any time by replying to one of them or by contacting us. | 2000 |
| `privacy.s3.heading` | Privacy · Part 3 · Heading | Who can see it | 60 |
| `privacy.s3.body` | Privacy · Part 3 · Text | Your details go to our team and nowhere else. We do not sell them, and we do not share them with advertisers.

Service providers run the site for us and handle data only on our behalf. Vercel hosts the website and, like any web host, keeps short-lived technical logs of visits, including internet addresses, to run and protect it. Supabase stores our database in the United States. | 2000 |
| `privacy.s4.heading` | Privacy · Part 4 · Heading | Cookies and your browser | 60 |
| `privacy.s4.body` | Privacy · Part 4 · Text | This site does not use advertising or tracking cookies. The products you pick are kept in your own browser, not on our servers, so they are still there when you come back. Sending your request clears them. | 2000 |
| `privacy.s5.heading` | Privacy · Part 5 · Heading | How long we keep it | 60 |
| `privacy.s5.body` | Privacy · Part 5 · Text | We keep your request and contact details for as long as we need them to work with you and to keep our business records. Ask us and we will delete them, unless the law requires us to keep them. | 2000 |
| `privacy.s6.heading` | Privacy · Part 6 · Heading | Your choices | 60 |
| `privacy.s6.body` | Privacy · Part 6 · Text | You can ask us what we hold about you, ask us to correct it or delete it, and stop marketing emails at any time. Use the contact details at the bottom of this page, or send us a message through the form on our home page, and say what you would like us to do. | 2000 |
| `privacy.s7.heading` | Privacy · Part 7 · Heading | Changes to this policy | 60 |
| `privacy.s7.body` | Privacy · Part 7 · Text | If we change this policy, we will update it here and change the date at the top of this page. | 2000 |
