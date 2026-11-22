# InquiryCard

Everything a client sent through the contact form, in one place, for admins only.

It shows who wrote, how to reach them, what they wrote and which products they asked about. Contact details are Chivo Mono links: the email opens a mail, the phone number dials. The message is shown in full on `bg-subtle`, with its line breaks kept.

## You provide

- `name`, `receivedAt` (already formatted) and `message`.
- Whatever the client gave: `company`, `email`, `phone`, `location`.
- `interestedIn`: the names of the products they picked in the catalog.
- `status`: `new` (an `ink` outline and a volt New badge), `read`, or `replied` (a `success` badge).
- `onReply` and `onMarkRead`. Without `onReply`, Reply opens a mail to `email`. Mark as read shows only while the status is `new`.

## Privacy

This card holds personal contact details. Render it only inside the signed-in admin, and load its data on the server for admins only; the component displays what it is given and checks nothing itself. The footer line ("Visible to admins only") tells the admin so. Change it with `privacyNote` or hide it with `false`.

## Don't

- Never show an InquiryCard, or any part of an inquiry, on the storefront.
- Don't shorten the message. If a list needs a preview, use a DataTable row and open the card from it.
- Newest first, with `new` inquiries above the rest.
