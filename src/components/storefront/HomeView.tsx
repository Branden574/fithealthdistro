import { Accordion, Icon } from '@ds';
import type { Catalog } from '@/lib/catalog';
import { CATALOG_ID, categoryHref } from '@/lib/catalog/links';
import { pick, t, type Copy } from '@/lib/copy';
import type { StorefrontFaq } from '@/lib/content/storefront';
import { paragraphs } from '@/lib/text';
import { CatalogBrowser } from './CatalogBrowser';
import { CategoryIndex } from './CategoryIndex';
import { ContactForm, type InterestGroup } from './ContactForm';
import { Hero } from './Hero';
import { RequestSummary } from './RequestSummary';

export interface HomeViewProps {
  copy: Copy;
  faqs: StorefrontFaq[];
  catalog: Catalog;
}

/**
 * The home page: hero, catalog, FAQ and contact. Everything comes in as props, so the admin's draft preview can render
 * the same page from draft copy and FAQs.
 */
export function HomeView({ copy, faqs, catalog }: HomeViewProps) {
  const { categories, products } = catalog;
  const index = categories.map((category) => ({ slug: category.slug, name: category.name, href: categoryHref(category.slug) }));
  const groups: InterestGroup[] = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    products: products
      .filter((product) => product.categoryId === category.id)
      .map((product) => ({ id: product.id, name: product.name, outOfStock: product.stock === 'out_of_stock' })),
  }));

  return (
    <>
      <Hero copy={copy} aside={<CategoryIndex categories={index} />} />

      <section className="section" id={CATALOG_ID} aria-labelledby="catalog-title" tabIndex={-1} data-reveal>
        <div className="wrap">
          <CatalogBrowser
            heading={
              <div>
                <p className="eyebrow">{t(copy, 'catalog.eyebrow')}</p>
                <h2 className="display-lg" id="catalog-title">
                  {t(copy, 'catalog.heading')}
                </h2>
              </div>
            }
            copy={pick(copy, ['catalog.'])}
            categories={categories}
            products={products}
          />
        </div>
      </section>

      {faqs.length ? (
        <section className="section" id="faq" aria-labelledby="faq-title" data-reveal>
          <div className="wrap split">
            <div className="split__intro">
              <p className="eyebrow">{t(copy, 'faq.eyebrow')}</p>
              <h2 className="display-lg" id="faq-title">
                {t(copy, 'faq.heading')}
              </h2>
              <p className="split__body">{t(copy, 'faq.body')}</p>
            </div>
            <Accordion
              items={faqs.map((faq) => ({
                id: faq.id,
                title: faq.question,
                // Plain text only: paragraphs split on blank lines, never HTML.
                content: paragraphs(faq.answer).map((paragraph, at) => <p key={at}>{paragraph}</p>),
              }))}
            />
          </div>
        </section>
      ) : null}

      <section className="section section--band" id="contact" aria-labelledby="contact-title" data-reveal>
        <div className="wrap split">
          <div className="split__intro">
            <p className="eyebrow">{t(copy, 'contact.eyebrow')}</p>
            <h2 className="display-lg" id="contact-title">
              {t(copy, 'contact.heading')}
            </h2>
            <p className="split__body">{t(copy, 'contact.body')}</p>
            <p className="caption contact__privacy">
              <Icon name="lock-simple" size={16} />
              {t(copy, 'contact.privacy')}
            </p>
            <RequestSummary
              copy={pick(copy, ['request.', 'catalog.card.removed.announce'])}
              categories={categories}
              products={products}
            />
          </div>
          <ContactForm
            copy={pick(copy, ['contact.', 'catalog.stock.out', 'catalog.card.added.announce', 'catalog.card.removed.announce', 'a11y.newtab'])}
            groups={groups}
          />
        </div>
      </section>
    </>
  );
}
