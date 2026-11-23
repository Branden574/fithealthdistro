'use client';

import { Alert, Button, TextField } from '@ds';
import { useActionState, useEffect, useRef } from 'react';
import { signIn, type SignInState } from '@/lib/admin/session-actions';

const INITIAL: SignInState = { status: 'idle' };

const PROBLEM: Partial<Record<SignInState['status'], { title: string; body: string }>> = {
  wrong: { title: 'Those details do not match', body: 'Check your email and password, then try again.' },
  denied: { title: 'This account cannot open the admin', body: 'Ask an admin to add you, then sign in again.' },
  limited: { title: 'Too many tries', body: 'Wait 15 minutes, then try again.' },
  error: { title: 'We could not sign you in', body: 'Try again in a moment.' },
};

/** Email and password. Works without the script too: the form posts to the same action. */
export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, INITIAL);
  const alertRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const problem = PROBLEM[state.status];

  useEffect(() => {
    if (state.status === 'invalid') {
      const field = state.errors?.email ? 'email' : 'password';
      formRef.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
    } else if (state.status !== 'idle') {
      alertRef.current?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} className="sign-in__form" action={action} noValidate aria-busy={pending || undefined}>
      {problem ? (
        <div ref={alertRef} tabIndex={-1} className="sign-in__problem">
          <Alert tone="danger" className="fhd-appear" title={problem.title}>
            {problem.body}
          </Alert>
        </div>
      ) : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <TextField
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="username"
        spellCheck={false}
        maxLength={254}
        defaultValue={state.email}
        error={state.errors?.email}
      />
      <TextField
        name="password"
        type="password"
        label="Password"
        required
        autoComplete="current-password"
        maxLength={200}
        error={state.errors?.password}
      />
      <Button type="submit" variant="primary" block loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
