import { Wordmark } from '@ds';
import { t, type Copy } from '@/lib/copy';
import { currentYear } from '@/lib/content/year';

export async function SiteFooter({ copy }: { copy: Copy }) {
  const year = await currentYear();
  return (
    <footer className="site-footer" data-theme="dark">
      <div className="wrap site-footer__inner">
        <Wordmark size={40} stacked />
        <p className="caption site-footer__copy">{t(copy, 'footer.copyright', { year })}</p>
      </div>
    </footer>
  );
}
