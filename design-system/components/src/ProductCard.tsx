import * as React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Icon } from './Icon';
import { type IconName } from './icons';
import { type Tone } from './types';
import { cx } from './util';

export interface ProductCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** The product name, sentence case. */
  name: string;
  /** Shown as an eyebrow: "Vending machines", "Supplements", "Drinks". */
  category?: string;
  /** One or two lines. Clamped to two. */
  description?: string;
  /** Photo URL, shown 4:3 and cropped to fill. */
  image?: string;
  imageAlt?: string;
  /** Category glyph shown while there is no photo. */
  icon?: IconName;
  /** A number is formatted as US dollars; a string is shown as given ("Call for price"). Leave it out to hide the price. */
  price?: number | string;
  /** A short line under the price: "per case of 12", "starting at". */
  priceNote?: string;
  /** Up to two badges over the photo. */
  badges?: Array<{ label: string; tone?: Tone | 'solid' }>;
  /** Out of stock or hidden: the photo fades and the button is disabled. */
  unavailable?: boolean;
  /** The client has already added this product to their request. */
  selected?: boolean;
  /** Button label. Default "I'm interested". */
  ctaLabel?: string;
  /** Button label once selected. Default "Added". */
  selectedLabel?: string;
  /** Button label when `unavailable`. Default "Unavailable". */
  unavailableLabel?: string;
  /** Called when the client presses the button. */
  onInterest?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Links the name to the product page. */
  href?: string;
}

function formatPrice(price: number | string): string {
  if (typeof price === 'string') return price;
  const cents = Math.round(price * 100) % 100 !== 0;
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
}

/** One product in the catalog: photo, name, price and the button a client presses to ask about it. */
export function ProductCard(props: ProductCardProps) {
  const {
    name,
    category,
    description,
    image,
    imageAlt,
    icon = 'package',
    price,
    priceNote,
    badges,
    unavailable,
    selected,
    ctaLabel = "I'm interested",
    selectedLabel = 'Added',
    unavailableLabel = 'Unavailable',
    onInterest,
    href,
    className,
    ...rest
  } = props;
  // Every card's button reads the same, so it is described by the product's name.
  const nameId = React.useId();
  return (
    <article className={cx('fhd-product', unavailable && 'fhd-product--unavailable', className)} {...rest}>
      <div className="fhd-product__media">
        {image ? <img src={image} alt={imageAlt ?? ''} loading="lazy" /> : <Icon name={icon} size={48} />}
        {badges && badges.length ? (
          <div className="fhd-product__badges">
            {badges.slice(0, 2).map((badge) => (
              <Badge key={badge.label} tone={badge.tone}>
                {badge.label}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="fhd-product__body">
        {category ? <span className="fhd-product__category">{category}</span> : null}
        <h3 className="fhd-product__name" id={nameId}>
          {href ? <a href={href}>{name}</a> : name}
        </h3>
        {description ? <p className="fhd-product__desc">{description}</p> : null}
        <div className="fhd-product__foot">
          {price != null ? (
            <div className="fhd-product__price">
              {formatPrice(price)}
              {priceNote ? <span className="fhd-product__price-note">{priceNote}</span> : null}
            </div>
          ) : null}
          <Button
            block
            variant={selected ? 'solid' : 'primary'}
            iconLeft={selected ? 'check' : undefined}
            disabled={unavailable}
            aria-pressed={unavailable ? undefined : !!selected}
            aria-describedby={nameId}
            onClick={onInterest}
          >
            {unavailable ? unavailableLabel : selected ? selectedLabel : ctaLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
