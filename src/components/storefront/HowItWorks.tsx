import { Icon, type IconName } from '@ds';
import { t, type Copy } from '@/lib/copy';

const STEPS: ReadonlyArray<{ step: 1 | 2 | 3; icon: IconName }> = [
  { step: 1, icon: 'magnifying-glass' },
  { step: 2, icon: 'chat-text' },
  { step: 3, icon: 'receipt' },
];

/** Three steps from the catalog to a quote, under the hero. Every word is a copy slot Ryan can edit. */
export function HowItWorks({ copy }: { copy: Copy }) {
  return (
    <section className="section section--band" aria-labelledby="how-title" data-reveal>
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">{t(copy, 'home.how.eyebrow')}</p>
            <h2 className="display-lg" id="how-title">
              {t(copy, 'home.how.heading')}
            </h2>
          </div>
        </div>
        <ol className="how__steps">
          {STEPS.map(({ step, icon }) => (
            <li key={step} className="how__step">
              <div className="how__top">
                {/* The list already numbers the steps for screen readers. */}
                <span className="display-md how__number" aria-hidden="true">
                  {String(step).padStart(2, '0')}
                </span>
                <span className="how__icon">
                  <Icon name={icon} size={24} />
                </span>
              </div>
              <h3 className="title how__title">{t(copy, `home.how.${step}.title`)}</h3>
              <p className="how__body">{t(copy, `home.how.${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
