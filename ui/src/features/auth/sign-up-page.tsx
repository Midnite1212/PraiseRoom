import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { clearAuthToken } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';
import { toSafeRedirect } from '@/lib/safe-redirect';

import { AuthField, firstError } from './auth-field';
import {
  AUTH_FINE_CLASSES,
  AUTH_SUB_CLASSES,
  AUTH_SWITCH_CLASSES,
  AUTH_TITLE_CLASSES,
  AuthLayout,
} from './auth-layout';
import { saveCheckEmailState } from './check-email-state';
import { type AuthErrorKey, toAuthErrorKey } from './errors';
import { GoogleSignIn } from './google-sign-in';
import { signUpSchema } from './schemas';
import { sessionQueryOptions } from './session';

export function SignUpPage({ redirect }: { redirect: string | undefined }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const redirectPath = toSafeRedirect(redirect);

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onSubmit: signUpSchema((key) => t(key)) },
    onSubmit: async ({ value }) => {
      setErrorKey(null);
      const email = value.email.trim();
      try {
        await authClient.signUp({ name: value.name.trim(), email, password: value.password });
      } catch (error: unknown) {
        setErrorKey(toAuthErrorKey(error));
        return;
      }
      clearAuthToken();
      await queryClient.resetQueries({ queryKey: sessionQueryOptions.queryKey });
      // The session query also creates the ownership record on a first sign-in. Without a session,
      // the account still has to be verified by email.
      const session = await queryClient.fetchQuery(sessionQueryOptions);
      if (session) {
        await navigate({ href: redirectPath, replace: true });
        return;
      }
      saveCheckEmailState({ email, kind: 'verify' });
      await navigate({ to: '/check-email', replace: true });
    },
  });

  const handleGoogle = async () => {
    setErrorKey(null);
    try {
      await authClient.signInWithGoogle(redirectPath);
    } catch {
      setErrorKey('auth.errors.failed');
    }
  };

  return (
    <AuthLayout>
      <h1 className={AUTH_TITLE_CLASSES}>{t('auth.signUp.title')}</h1>
      <p className={AUTH_SUB_CLASSES}>{t('auth.signUp.description')}</p>
      <GoogleSignIn label={t('auth.google.signUp')} onClick={() => void handleGoogle()} />
      {errorKey ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{t(errorKey)}</AlertDescription>
        </Alert>
      ) : null}
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <AuthField
              id="name"
              label={t('auth.signUp.name')}
              autoComplete="name"
              value={field.state.value}
              error={field.state.meta.isTouched ? firstError(field.state.meta.errors) : undefined}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field name="email">
          {(field) => (
            <AuthField
              id="email"
              type="email"
              label={t('auth.email')}
              autoComplete="email"
              value={field.state.value}
              error={field.state.meta.isTouched ? firstError(field.state.meta.errors) : undefined}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <AuthField
              id="password"
              type="password"
              label={t('auth.password')}
              autoComplete="new-password"
              meter
              value={field.state.value}
              error={field.state.meta.isTouched ? firstError(field.state.meta.errors) : undefined}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
              {t('auth.signUp.submit')}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className={AUTH_FINE_CLASSES}>{t('auth.signUp.privacy')}</p>
      <p className={AUTH_SWITCH_CLASSES}>
        {t('auth.signUp.haveAccount')}{' '}
        <Button asChild variant="link" size="sm">
          <Link to="/login" search={{ redirect }}>
            {t('auth.signUp.signIn')}
          </Link>
        </Button>
      </p>
    </AuthLayout>
  );
}
