import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { LanguageChoice, ThemeChoice } from '@/components/layout/preference-choices';
import { BrandMark } from '@/components/primitives/brand-mark';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { sessionQueryOptions } from '@/features/auth/session';
import { clearAuthToken } from '@/lib/api-client';
import { AuthError, authClient } from '@/lib/auth-client';
import { toSafeRedirect } from '@/lib/safe-redirect';

const loginSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
    if (session) {
      throw redirect({ href: toSafeRedirect(search.redirect) });
    }
  },
  component: LoginPage,
});

type LoginErrorKey = 'login.invalidCredentials' | 'login.verifyEmail' | 'login.failed';

const toLoginErrorKey = (error: unknown): LoginErrorKey => {
  if (!(error instanceof AuthError)) return 'login.failed';
  if (error.status === 401) return 'login.invalidCredentials';
  if (error.code === 'EMAIL_NOT_VERIFIED') return 'login.verifyEmail';
  return 'login.failed';
};

function LoginPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorKey, setErrorKey] = useState<LoginErrorKey | null>(null);
  const redirectPath = toSafeRedirect(search.redirect);

  const loginSchema = z.object({
    email: z.email(t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setErrorKey(null);
      try {
        await authClient.signInWithEmail(value);
      } catch (error: unknown) {
        setErrorKey(toLoginErrorKey(error));
        return;
      }
      clearAuthToken();
      await queryClient.resetQueries({ queryKey: sessionQueryOptions.queryKey });
      await router.navigate({ href: redirectPath, replace: true });
    },
  });

  const handleGoogle = async () => {
    setErrorKey(null);
    try {
      await authClient.signInWithGoogle(redirectPath);
    } catch {
      setErrorKey('login.failed');
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-5 p-4">
      <div aria-hidden className="ground-wash pointer-events-none fixed inset-0" />
      <div className="relative flex items-center gap-2 text-lg font-bold tracking-[-0.01em]">
        <BrandMark className="size-5" />
        {t('app.name')}
      </div>
      <main className="glass relative flex w-full max-w-sm flex-col gap-4 p-5 [--glass-r:28px]">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.03em]">
            {t('login.title')}
          </h1>
          <p className="text-ink-2 mt-1 text-sm">{t('login.description')}</p>
        </div>
        {errorKey ? (
          <Alert variant="destructive">
            <AlertDescription>{t(errorKey)}</AlertDescription>
          </Alert>
        ) : null}
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="email">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t('login.email')}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="password">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t('login.password')}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      autoComplete="current-password"
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            </form.Field>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {t('login.submit')}
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
        <Button variant="secondary" onClick={() => void handleGoogle()}>
          {t('login.google')}
        </Button>
      </main>
      <div className="relative flex flex-wrap justify-center gap-2">
        <LanguageChoice />
        <ThemeChoice />
      </div>
    </div>
  );
}
