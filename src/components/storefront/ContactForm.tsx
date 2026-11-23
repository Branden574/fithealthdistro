'use client';

import { Fragment, startTransition, useActionState, useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react';
import { Alert, Button, Checkbox, CheckboxGroup, TextField } from '@ds';
import { announce } from '@/lib/a11y/announce';
import { t, type Copy } from '@/lib/copy/text';
import { CONTACT_FIELDS, CONTACT_LIMITS, INITIAL_CONTACT_STATE, TRAP_FIELD, type ContactField, type TextField as TextFieldName } from '@/lib/inquiry/form';
import { sendRequest } from '@/lib/inquiry/send';
import { requestStore } from '@/lib/request/store';

/** One category under "I am interested in", with the products that can be picked under it. */
export interface InterestGroup {
  slug: string;
  name: string;
  products: Array<{ id: string; name: string; outOfStock: boolean }>;
}

interface ContactFormProps {
  /** The contact.* slots, plus the stock badge, the request announcements and the new-tab note. */
  copy: Copy;
  groups: InterestGroup[];
  /** In the admin's draft preview the form is shown but cannot send, so trying it never makes a real inquiry. */
  preview?: boolean;
  /** The site's root for the Terms and Privacy links: empty, or "/preview" in the draft preview. */
  linkBase?: string;
}

const FIELD_MESSAGE: Partial<Record<ContactField, string>> = {
  name: 'contact.error.name',
  email: 'contact.error.email',
  phone: 'contact.error.phone',
  interest: 'contact.error.interests',
  terms: 'contact.error.terms',
};

/** Fills {placeholders} in a sentence with elements: "I agree to the {terms}" with a link for {terms}. */
function withNodes(template: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/g).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={index}>{name && name in nodes ? nodes[name] : part}</Fragment>;
  });
}

const subscribeToNothing = () => () => {};
const isScripted = () => true;
const isNotScripted = () => false;

/**
 * The quote request form. With the script it sends without reloading, keeps what was typed when something needs fixing,
 * and keeps the product boxes in step with the request the catalog builds. Without it, it still posts to the same action.
 */
export function ContactForm({ copy, groups, preview = false, linkBase = '' }: ContactFormProps) {
  const [state, send, pending] = useActionState(sendRequest, INITIAL_CONTACT_STATE);
  const values = state.values ?? {};
  const stored = useSyncExternalStore(requestStore.subscribe, requestStore.getSnapshot, requestStore.getServerSnapshot);
  // Until the script runs, the product boxes show what was posted, so a form sent back without the script keeps its ticks.
  const scripted = useSyncExternalStore(subscribeToNothing, isScripted, isNotScripted);
  const picked = scripted ? stored : (values.productIds ?? []);
  // A form sent before the script loaded comes back with its picks: carry them into the shared request.
  const arrivedWith = useRef(values.productIds);
  useEffect(() => {
    for (const id of arrivedWith.current ?? []) requestStore.add(id);
  }, []);
  // Categories ticked here. A category with a picked product is ticked too, wherever the product was picked.
  const [opened, setOpened] = useState<readonly string[]>(values.interests ?? []);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  // One id per request, reused if it has to be sent again, so a resend after a lost reply is recorded once.
  const submissionId = useRef('');

  useEffect(() => {
    if (state.status === 'sent') {
      requestStore.clear();
      doneRef.current?.focus();
    } else if (state.status === 'invalid') {
      const first = CONTACT_FIELDS.find((field) => state.errors?.[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    } else if (state.status !== 'idle') {
      // The button was disabled while sending, which drops focus; put it back where the visitor left it.
      formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
    }
  }, [state]);

  const pickedSet = new Set(picked);
  const isTicked = (group: InterestGroup) => opened.includes(group.slug) || group.products.some((product) => pickedSet.has(product.id));

  function tickCategory(group: InterestGroup, on: boolean) {
    setOpened((now) => (on ? [...now, group.slug] : now.filter((slug) => slug !== group.slug)));
    // Unticking a category takes its products out of the request too, so the two never disagree.
    if (!on) for (const product of group.products) if (pickedSet.has(product.id)) requestStore.remove(product.id);
  }

  function tickProduct(product: InterestGroup['products'][number], on: boolean) {
    if (on) {
      if (requestStore.add(product.id)) announce(t(copy, 'catalog.card.added.announce', { name: product.name }));
    } else {
      requestStore.remove(product.id);
      announce(t(copy, 'catalog.card.removed.announce', { name: product.name }));
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    submissionId.current ||= globalThis.crypto?.randomUUID?.() ?? '';
    if (submissionId.current) data.set('submission_id', submissionId.current);
    startTransition(() => send(data));
  }

  function errorFor(field: ContactField): string | undefined {
    const error = state.errors?.[field];
    if (!error) return undefined;
    if (error === 'long' && field in CONTACT_LIMITS) return t(copy, 'contact.error.long', { max: CONTACT_LIMITS[field as TextFieldName] });
    const key = FIELD_MESSAGE[field];
    return key ? t(copy, key) : undefined;
  }

  if (state.status === 'sent') {
    return (
      <div ref={doneRef} className="contact__done" tabIndex={-1}>
        <Alert tone="success" className="fhd-appear" title={t(copy, 'contact.success.title')}>
          {t(copy, 'contact.success.body')}
        </Alert>
      </div>
    );
  }

  const failure =
    state.status === 'invalid'
      ? { title: t(copy, 'contact.error.title'), body: t(copy, 'contact.error.body') }
      : state.status === 'rate_limited'
        ? { title: t(copy, 'contact.error.rate.title'), body: t(copy, 'contact.error.rate.body') }
        : state.status === 'error'
          ? { title: t(copy, 'contact.error.server.title'), body: t(copy, 'contact.error.server.body') }
          : null;

  // The policy links open in a new tab, so nothing typed here is lost.
  const policyLink = (href: string, label: string) => (
    <a className="contact-form__link" href={href} target="_blank" rel="noopener">
      {label}
      <span className="fhd-sr"> {t(copy, 'a11y.newtab')}</span>
    </a>
  );

  return (
    <form
      ref={formRef}
      className="contact-form"
      action={send}
      onSubmit={onSubmit}
      // An edit makes it a new request: if an earlier send was recorded after all, the edited one is not taken for a repeat.
      onInput={() => {
        submissionId.current = '';
      }}
      noValidate
      aria-busy={pending || undefined}
    >
      <TextField
        name="name"
        label={t(copy, 'contact.form.name')}
        required
        autoComplete="name"
        maxLength={CONTACT_LIMITS.name}
        defaultValue={values.name}
        error={errorFor('name')}
      />
      <TextField
        name="company"
        label={t(copy, 'contact.form.company')}
        autoComplete="organization"
        maxLength={CONTACT_LIMITS.company}
        defaultValue={values.company}
        error={errorFor('company')}
      />
      <TextField
        name="email"
        type="email"
        label={t(copy, 'contact.form.email')}
        required
        autoComplete="email"
        spellCheck={false}
        maxLength={CONTACT_LIMITS.email}
        defaultValue={values.email}
        error={errorFor('email')}
      />
      <TextField
        name="phone"
        type="tel"
        label={t(copy, 'contact.form.phone')}
        autoComplete="tel"
        maxLength={CONTACT_LIMITS.phone}
        defaultValue={values.phone}
        error={errorFor('phone')}
      />

      <CheckboxGroup
        className="contact-form__wide"
        legend={t(copy, 'contact.form.interest')}
        hint={t(copy, 'contact.form.interest.hint')}
        required
        error={errorFor('interest')}
      >
        {groups.map((group) => (
          <div key={group.slug} className="interest-option">
            <Checkbox
              name="interest"
              value={group.slug}
              label={group.name}
              checked={isTicked(group)}
              onChange={(event) => tickCategory(group, event.currentTarget.checked)}
            />
            {group.products.length ? (
              // Shown by CSS while its category is ticked, so it works before the script runs too.
              <CheckboxGroup legend={t(copy, 'contact.form.products.label', { category: group.name })} hideLegend nested>
                {group.products.map((product) => (
                  <Checkbox
                    key={product.id}
                    name="product_ids"
                    value={product.id}
                    label={product.name}
                    hint={product.outOfStock ? t(copy, 'catalog.stock.out') : undefined}
                    checked={pickedSet.has(product.id)}
                    onChange={(event) => tickProduct(product, event.currentTarget.checked)}
                  />
                ))}
              </CheckboxGroup>
            ) : null}
          </div>
        ))}
      </CheckboxGroup>

      <TextField
        className="contact-form__wide"
        name="message"
        label={t(copy, 'contact.form.message')}
        hint={t(copy, 'contact.form.message.hint')}
        multiline
        rows={4}
        maxLength={CONTACT_LIMITS.message}
        defaultValue={values.message}
        error={errorFor('message')}
      />

      <div className="contact-form__wide contact-form__consent">
        <Checkbox
          name="terms"
          value="yes"
          required
          defaultChecked={values.terms}
          error={errorFor('terms')}
          label={withNodes(t(copy, 'contact.form.terms'), {
            terms: policyLink(`${linkBase}/terms`, t(copy, 'contact.form.terms.link')),
            privacy: policyLink(`${linkBase}/privacy`, t(copy, 'contact.form.privacy.link')),
          })}
        />
        <Checkbox
          name="marketing"
          value="yes"
          defaultChecked={values.marketing}
          label={t(copy, 'contact.form.marketing')}
          hint={t(copy, 'contact.form.marketing.hint')}
        />
      </div>

      {/* The honeypot: off screen, out of the tab order and hidden from assistive tech. */}
      <div className="fhd-sr" aria-hidden="true">
        <label>
          {t(copy, 'contact.form.trap')}
          <input type="text" name={TRAP_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      {failure ? (
        // Keyed by attempt, so a second failure in a row is announced again.
        <Alert key={state.attempt} tone="danger" className="contact-form__wide fhd-appear" title={failure.title}>
          {failure.body}
        </Alert>
      ) : null}
      <div className="contact-form__wide">
        <Button variant="primary" size="lg" type="submit" iconRight="arrow-right" loading={pending} disabled={preview}>
          {pending ? t(copy, 'contact.form.submitting') : t(copy, 'contact.form.submit')}
        </Button>
      </div>
    </form>
  );
}
