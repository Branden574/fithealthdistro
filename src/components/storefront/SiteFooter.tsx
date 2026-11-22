import { Wordmark } from '@ds';
import { t, type Copy } from '@/lib/copy';

export function SiteFooter({ copy }: { copy: Copy }) {
  return (
    <footer className="site-footer" data-theme="dark">
      <div className="wrap site-footer__inner">
        <Wordmark size={40} stacked />
        <p className="caption site-footer__copy">{t(copy, 'footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
