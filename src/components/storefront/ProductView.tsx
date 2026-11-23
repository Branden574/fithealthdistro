import { Badge, Gallery, Icon, SpecList } from '@ds';
import type { ProductDetail } from '@/lib/catalog';
import { CATALOG_ID, homeHref } from '@/lib/catalog/links';
import { pick, t, type Copy } from '@/lib/copy';
import { paragraphs } from '@/lib/text';
import { InterestButton } from './InterestButton';

/** "$4,250" or "$39.99". Matches the catalog card. */
function dollars(amount: number): string {
  const cents = Math.round(amount * 100) % 100 !== 0;
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
}

/** A product's own page: photos, name, price, description, the request button, and its specs. */
export function ProductView({ copy, product, linkBase = '' }: { copy: Copy; product: ProductDetail; linkBase?: string }) {
  const unavailable = product.stock === 'out_of_stock';
  const hasPrice = product.price != null && product.price > 0;
  const badges: Array<{ label: string; tone: 'danger' | 'warning' | 'neutral' }> = [];
  if (unavailable) badges.push({ label: t(copy, 'catalog.stock.out'), tone: 'danger' });
  else if (product.stock === 'low_stock') badges.push({ label: t(copy, 'catalog.stock.low'), tone: 'warning' });
  if (product.isSample) badges.push({ label: t(copy, 'catalog.card.sample'), tone: 'neutral' });

  return (
    <article className="section product-page" aria-labelledby="product-title">
      <div className="wrap">
        <a className="product-page__back" href={homeHref(linkBase, CATALOG_ID)}>
          <Icon name="arrow-left" size={16} />
          {t(copy, 'product.back')}
        </a>
        <div className="product-page__grid">
          {/* The name beside it says what the photos show, so each has empty alt text. */}
          <Gallery
            className="fhd-enter"
            photos={product.photos.map((src) => ({ src }))}
            label={t(copy, 'product.gallery.label', { name: product.name })}
            previousLabel={t(copy, 'product.gallery.previous')}
            nextLabel={t(copy, 'product.gallery.next')}
            photoLabel={t(copy, 'product.gallery.photo')}
            placeholder={<Icon name={product.category.icon} size={96} />}
            dimmed={unavailable}
          />
          <div className="product-page__info fhd-enter fhd-enter-1">
            <p className="eyebrow product-page__category">{product.category.name}</p>
            <h1 className="headline product-page__name" id="product-title">
              {product.name}
            </h1>
            {badges.length ? (
              <div className="row">
                {badges.map((badge) => (
                  <Badge key={badge.label} tone={badge.tone}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}
            {hasPrice || product.priceNote ? (
              <p className="product-page__price">
                {hasPrice ? <span className="display-sm">{dollars(product.price as number)}</span> : null}
                {product.priceNote ? <span className={hasPrice ? 'caption' : 'display-sm'}>{product.priceNote}</span> : null}
              </p>
            ) : null}
            {paragraphs(product.details || product.description).map((paragraph, index) => (
              <p key={index} className="product-page__text">
                {paragraph}
              </p>
            ))}
            <InterestButton
              productId={product.id}
              name={product.name}
              unavailable={unavailable}
              copy={pick(copy, ['catalog.card.', 'product.request.view', 'nav.cta'])}
              contactHref={homeHref(linkBase, 'contact')}
            />
          </div>
        </div>
        {product.specs.length ? (
          <section className="product-page__specs" aria-labelledby="specs-title">
            <h2 className="display-sm" id="specs-title">
              {t(copy, 'product.specs.heading')}
            </h2>
            <SpecList items={product.specs} />
          </section>
        ) : null}
      </div>
    </article>
  );
}
