import { Logo } from '@ds';
import type { PublicSettings } from '@/lib/catalog';
import { t, type Copy } from '@/lib/copy';
import { currentYear } from '@/lib/content/year';

/** "(555) 010-2030" -> "tel:5550102030"; a leading + is kept. */
function telHref(phone: string): string {
  return `tel:${phone.trim().startsWith('+') ? '+' : ''}${phone.replace(/\D/g, '')}`;
}

export async function SiteFooter({ copy, settings, linkBase = '' }: { copy: Copy; settings: PublicSettings; linkBase?: string }) {
  const year = await currentYear();
  const { email, phone } = settings;
  return (
    <footer className="site-footer" data-theme="dark">
      <div className="wrap site-footer__inner">
        <Logo height={64} />
        <div className="site-footer__end">
          {email || phone ? (
            <dl className="site-footer__contact">
              {email ? (
                <div>
                  <dt className="eyebrow">{t(copy, 'footer.email')}</dt>
                  <dd>
                    <a className="data" href={`mailto:${email}`}>
                      {email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {phone ? (
                <div>
                  <dt className="eyebrow">{t(copy, 'footer.phone')}</dt>
                  <dd>
                    <a className="data" href={telHref(phone)}>
                      {phone}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          <nav aria-label={t(copy, 'footer.legal.label')}>
            <ul className="site-footer__legal">
              <li>
                <a className="body-sm" href={`${linkBase}/terms`}>{t(copy, 'footer.terms')}</a>
              </li>
              <li>
                <a className="body-sm" href={`${linkBase}/privacy`}>{t(copy, 'footer.privacy')}</a>
              </li>
            </ul>
          </nav>
          <p className="caption site-footer__copy">{t(copy, 'footer.copyright', { year })}</p>
        </div>
      </div>
    </footer>
  );
}
