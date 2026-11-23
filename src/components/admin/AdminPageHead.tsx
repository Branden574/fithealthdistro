import type { ReactNode } from 'react';

interface AdminPageHeadProps {
  /** The section in the sidebar: "Catalog". */
  eyebrow: string;
  title: string;
  /** The page's buttons. One of them, at most, is `primary`. */
  actions?: ReactNode;
}

/** The top of every admin page: where you are, and the page's main actions on the right. */
export function AdminPageHead({ eyebrow, title, actions }: AdminPageHeadProps) {
  return (
    <div className="admin-head">
      <div>
        <p className="eyebrow admin-head__eyebrow">{eyebrow}</p>
        <h1 className="display-md admin-head__title">{title}</h1>
      </div>
      {actions ? <div className="row admin-head__actions">{actions}</div> : null}
    </div>
  );
}
