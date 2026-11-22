import { t, type Copy } from '@/lib/copy';
import { paragraphs } from '@/lib/text';

/**
 * The Terms of Use or the Privacy Policy, from the copy store: a title, the date, an introduction, then numbered parts
 * (`<prefix>.s1.heading`, `<prefix>.s1.body`, ...). A part whose heading and text are both empty is left out.
 */
export function LegalPage({ copy, prefix }: { copy: Copy; prefix: 'terms' | 'privacy' }) {
  const parts: Array<{ heading: string; body: string }> = [];
  for (let n = 1; `${prefix}.s${n}.heading` in copy || `${prefix}.s${n}.body` in copy; n++) {
    const heading = copy[`${prefix}.s${n}.heading`] ?? '';
    const body = copy[`${prefix}.s${n}.body`] ?? '';
    if (heading.trim() || body.trim()) parts.push({ heading, body });
  }

  return (
    <article className="section legal" aria-labelledby="legal-title">
      <div className="wrap wrap--narrow">
        <h1 className="display-lg legal__title" id="legal-title">
          {t(copy, `${prefix}.title`)}
        </h1>
        <p className="caption legal__updated">{t(copy, `${prefix}.updated`)}</p>
        {paragraphs(t(copy, `${prefix}.intro`)).map((paragraph, index) => (
          <p key={index} className="lead legal__intro">
            {paragraph}
          </p>
        ))}
        {parts.map((part, index) => (
          <section key={index} className="legal__part">
            {part.heading.trim() ? <h2 className="display-sm">{part.heading}</h2> : null}
            {paragraphs(part.body).map((paragraph, at) => (
              <p key={at}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
