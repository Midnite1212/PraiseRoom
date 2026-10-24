import { useForm } from '@tanstack/react-form';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
import { type AuthErrorKey, toAuthErrorKey } from './errors';
import { resetSchema } from './schemas';

// The page the emailed link opens. Better Auth adds `token` to the redirect, or `error` for a link that
// is invalid or expired.
export function ResetPage({ token }: { token: string | undefined }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [expired, setExpired] = useState(false);

  const form = useForm({
    defaultValues: { password: '', confirm: '' },
    validators: { onSubmit: resetSchema((key) => t(key)) },
    onSubmit: async ({ value }) => {
      if (!token) return;
      setErrorKey(null);
      try {
        await authClient.resetPassword({ newPassword: value.password, token });
      } catch (error: unknown) {
        const key = toAuthErrorKey(error);
        if (key === 'auth.errors.invalidToken') setExpired(true);
        else setErrorKey(key);
        return;
      }
      toast.success(t('auth.reset.saved'));
      await navigate({ to: '/login', replace: true });
    },
  });

  if (!token || expired) {
    return (
      <AuthLayout>
        <h1 className={AUTH_TITLE_CLASSES}>{t('auth.reset.expiredTitle')}</h1>
        <p className={AUTH_SUB_CLASSES}>{t('auth.reset.expiredBody')}</p>
        <Button asChild className="w-full">
          <Link to="/forgot">{t('auth.reset.sendNew')}</Link>
        </Button>
        <p className={AUTH_SWITCH_CLASSES}>
          <Button asChild variant="link" size="sm">
            <Link to="/login">{t('auth.backToSignIn')}</Link>
          </Button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className={AUTH_TITLE_CLASSES}>{t('auth.reset.title')}</h1>
      <p className={AUTH_SUB_CLASSES}>{t('auth.reset.description')}</p>
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
        <form.Field name="password">
          {(field) => (
            <AuthField
              id="password"
              type="password"
              label={t('auth.reset.newPassword')}
              autoComplete="new-password"
              meter
              value={field.state.value}
              error={field.state.meta.isTouched ? firstError(field.state.meta.errors) : undefined}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field name="confirm">
          {(field) => (
            <AuthField
              id="confirm"
              type="password"
              label={t('auth.typeItAgain')}
              autoComplete="new-password"
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
              {t('auth.reset.submit')}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className={AUTH_SWITCH_CLASSES}>
        <Button asChild variant="link" size="sm">
          <Link to="/login">{t('auth.backToSignIn')}</Link>
        </Button>
      </p>
    </AuthLayout>
  );
}
