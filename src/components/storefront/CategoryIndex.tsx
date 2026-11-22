'use client';

import { Icon } from '@ds';
import { isModifiedClick, showCategory } from '@/lib/catalog/filter';

interface CategoryIndexProps {
  categories: Array<{ slug: string; name: string; href: string }>;
}

/** The hero's numbered list of categories. Each opens the catalog filtered to it. */
export function CategoryIndex({ categories }: CategoryIndexProps) {
  if (!categories.length) return null;
  return (
    <ul className="hero-index">
      {categories.map((category, index) => (
        <li key={category.slug}>
          <a
            className="hero-index__link"
            href={category.href}
            onClick={(event) => {
              if (!isModifiedClick(event) && showCategory(category.slug)) event.preventDefault();
            }}
          >
            <span className="data hero-index__number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="display-sm hero-index__name">{category.name}</span>
            <Icon name="arrow-right" size={24} />
          </a>
        </li>
      ))}
    </ul>
  );
}
