import { useForm } from '@tanstack/react-form';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

import { AuthField, firstError } from './auth-field';
import {
  AUTH_SUB_CLASSES,
  AUTH_SWITCH_CLASSES,
  AUTH_TITLE_CLASSES,
  AuthLayout,
} from './auth-layout';
import { saveCheckEmailState } from './check-email-state';
import { type AuthErrorKey, toAuthErrorKey } from './errors';
import { forgotSchema } from './schemas';

// The emailed link opens this app's /reset route, which receives Better Auth's `token`.
export const resetRedirectUrl = (origin: string): string => `${origin}/reset`;

export function ForgotPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onSubmit: forgotSchema((key) => t(key)) },
    onSubmit: async ({ value }) => {
      setErrorKey(null);
      const email = value.email.trim();
      try {
        await authClient.requestPasswordReset({
          email,
          redirectTo: resetRedirectUrl(window.location.origin),
        });
      } catch (error: unknown) {
        setErrorKey(toAuthErrorKey(error));
        return;
      }
      saveCheckEmailState({ email, kind: 'reset' });
      await navigate({ to: '/check-email' });
    },
  });

  return (
    <AuthLayout>
      <h1 className={AUTH_TITLE_CLASSES}>{t('auth.forgot.title')}</h1>
      <p className={AUTH_SUB_CLASSES}>{t('auth.forgot.description')}</p>
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
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
              {t('auth.forgot.submit')}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className={AUTH_SWITCH_CLASSES}>
        {t('auth.forgot.remembered')}{' '}
        <Button asChild variant="link" size="sm">
          <Link to="/login">{t('auth.forgot.signIn')}</Link>
        </Button>
      </p>
    </AuthLayout>
  );
}
