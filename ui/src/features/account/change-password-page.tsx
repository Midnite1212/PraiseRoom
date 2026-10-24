import { useForm } from '@tanstack/react-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { PageHeader } from '@/components/page/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AuthField, firstError } from '@/features/auth/auth-field';
import { type AuthErrorKey, toAuthErrorKey } from '@/features/auth/errors';
import { changePasswordSchema } from '@/features/auth/schemas';
import { authClient } from '@/lib/auth-client';

import { AccountBack } from './account-page';
import { ACCOUNT_QUERY_KEY, accountSessionsQueryOptions } from './api';

export function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessions = useQuery(accountSessionsQueryOptions);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const otherDevices = sessions.data ? Math.max(sessions.data.sessions.length - 1, 0) : null;

  const form = useForm({
    defaultValues: { current: '', password: '', confirm: '' },
    validators: { onSubmit: changePasswordSchema((key) => t(key)) },
    onSubmit: async ({ value }) => {
      setErrorKey(null);
      try {
        await authClient.changePassword({
          currentPassword: value.current,
          newPassword: value.password,
          revokeOtherSessions: signOutOthers,
        });
      } catch (error: unknown) {
        setErrorKey(toAuthErrorKey(error));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: [...ACCOUNT_QUERY_KEY] });
      toast.success(
        signOutOthers ? t('account.password.changedOthers') : t('account.password.changed')
      );
      await navigate({ to: '/account' });
    },
  });

  return (
    <>
      <AccountBack to="/account" label={t('account.title')} />
      <PageHeader
        title={t('account.password.title')}
        description={t('account.password.description')}
      />
      <form
        noValidate
        className="grid max-w-[480px] gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        {errorKey ? (
          <Alert variant="destructive">
            <AlertDescription>{t(errorKey)}</AlertDescription>
          </Alert>
        ) : null}
        <form.Field name="current">
          {(field) => (
            <AuthField
              id="current-password"
              type="password"
              label={t('account.password.current')}
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
        <form.Field name="password">
          {(field) => (
            <AuthField
              id="new-password"
              type="password"
              label={t('account.password.new')}
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
              id="confirm-password"
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
        <div className="border-hairline mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-y py-4">
          <span className="min-w-0">
            <b id="sign-out-others" className="block text-[0.9375rem] font-semibold">
              {t('account.password.signOutOthers')}
            </b>
            {otherDevices === null ? null : (
              <small className="text-ink-3 mt-[3px] block text-[0.8125rem]">
                {t('account.password.otherDevices', { count: otherDevices })}
              </small>
            )}
          </span>
          <Switch
            aria-labelledby="sign-out-others"
            checked={signOutOthers}
            onCheckedChange={setSignOutOthers}
          />
        </div>
        <div className="flex justify-end gap-2.5">
          <Button asChild variant="secondary">
            <Link to="/account">{t('editor.cancel')}</Link>
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {t('account.password.submit')}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </>
  );
}
