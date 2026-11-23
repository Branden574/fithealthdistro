import { Wordmark } from '@ds';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/admin/SignInForm';
import { getAdmin } from '@/lib/admin/auth';
import { afterSignIn } from '@/lib/admin/paths';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };

/** Reads the session on every visit, so it never comes from a cache. */
export const instant = false;

interface SignInPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [{ next }, admin] = await Promise.all([searchParams, getAdmin()]);
  const destination = afterSignIn(next);
  // Already signed in: straight on.
  if (admin) redirect(destination);
  return (
    <main className="sign-in">
      <div className="sign-in__card">
        <Wordmark size={24} />
        <div>
          <h1 className="display-md sign-in__title">Sign in</h1>
          <p className="sign-in__lead">For Fit Health Distribution admins.</p>
        </div>
        <SignInForm next={typeof next === 'string' ? destination : undefined} />
      </div>
    </main>
  );
}
