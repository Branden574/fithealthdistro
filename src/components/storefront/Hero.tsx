import type { ReactNode } from 'react';
import { Button } from '@ds';
import { t, type Copy } from '@/lib/copy';

/** Splits the headline around the highlighted words. The highlight must match the headline exactly, or none is shown. */
function splitHeadline(headline: string, highlight: string): [string, string, string] {
  const at = highlight ? headline.indexOf(highlight) : -1;
  if (at < 0) return [headline, '', ''];
  return [headline.slice(0, at), highlight, headline.slice(at + highlight.length)];
}

export function Hero({ copy, aside }: { copy: Copy; aside?: ReactNode }) {
  const [before, marked, after] = splitHeadline(t(copy, 'home.hero.headline'), t(copy, 'home.hero.highlight'));
  return (
    <section className="hero" data-theme="dark" aria-labelledby="hero-title">
      <div className="wrap hero__grid">
        <div>
          <p className="eyebrow hero__eyebrow fhd-enter">{t(copy, 'home.hero.eyebrow')}</p>
          <h1 className="display-xl hero__title fhd-enter fhd-enter-1" id="hero-title">
            {before}
            {marked ? <span className="fhd-mark">{marked}</span> : null}
            {after}
          </h1>
          <p className="lead hero__lead fhd-enter fhd-enter-2">{t(copy, 'home.hero.lead')}</p>
          <div className="row fhd-enter fhd-enter-3">
            <Button variant="primary" size="lg" iconRight="arrow-right" href="#contact">
              {t(copy, 'home.hero.primary')}
            </Button>
            <Button size="lg" href="#catalog">
              {t(copy, 'home.hero.secondary')}
            </Button>
          </div>
        </div>
        {aside ? <div className="fhd-enter fhd-enter-4">{aside}</div> : null}
      </div>
    </section>
  );
}
