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
  AUTH_SUB_CLASSES,
  AUTH_TITLE_CLASSES,
  AuthLayout,
  AUTH_SWITCH_CLASSES,
} from './auth-layout';
import { type AuthErrorKey, toAuthErrorKey } from './errors';
import { GoogleSignIn } from './google-sign-in';
import { signInSchema } from './schemas';
import { sessionQueryOptions } from './session';

export function SignInPage({ redirect }: { redirect: string | undefined }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const redirectPath = toSafeRedirect(redirect);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: signInSchema((key) => t(key)) },
    onSubmit: async ({ value }) => {
      setErrorKey(null);
      try {
        await authClient.signInWithEmail({ email: value.email.trim(), password: value.password });
      } catch (error: unknown) {
        setErrorKey(toAuthErrorKey(error));
        return;
      }
      clearAuthToken();
      await queryClient.resetQueries({ queryKey: sessionQueryOptions.queryKey });
      await navigate({ href: redirectPath, replace: true });
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
      <h1 className={AUTH_TITLE_CLASSES}>{t('auth.signIn.title')}</h1>
      <p className={AUTH_SUB_CLASSES}>{t('auth.signIn.description')}</p>
      <GoogleSignIn label={t('auth.google.continue')} onClick={() => void handleGoogle()} />
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
              autoComplete="current-password"
              value={field.state.value}
              error={field.state.meta.isTouched ? firstError(field.state.meta.errors) : undefined}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              action={
                <Button asChild variant="link" size="xs" className="-mr-1.5">
                  <Link to="/forgot">{t('auth.forgotIt')}</Link>
                </Button>
              }
            />
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
              {t('auth.signIn.submit')}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className={AUTH_SWITCH_CLASSES}>
        {t('auth.signIn.newHere')}{' '}
        <Button asChild variant="link" size="sm">
          <Link to="/sign-up" search={{ redirect }}>
            {t('auth.signIn.createAccount')}
          </Link>
        </Button>
      </p>
    </AuthLayout>
  );
}
