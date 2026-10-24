import { useForm } from '@tanstack/react-form';
import { Mail } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuthField, firstError } from '@/features/auth/auth-field';
import { type AuthErrorKey, toAuthErrorKey } from '@/features/auth/errors';
import { changeEmailSchema } from '@/features/auth/schemas';
import { authClient } from '@/lib/auth-client';

// Better Auth sends a confirmation link to the new address; the email changes once it is opened.
export function ChangeEmailDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onSubmit: changeEmailSchema((key) => t(key)) },
    onSubmit: async ({ value, formApi }) => {
      setErrorKey(null);
      const email = value.email.trim();
      try {
        await authClient.changeEmail(email);
      } catch (error: unknown) {
        setErrorKey(toAuthErrorKey(error));
        return;
      }
      formApi.reset();
      onOpenChange(false);
      toast.success(t('account.email.sent', { email }));
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset();
          setErrorKey(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <DialogHeader icon={<Mail />}>
            <DialogTitle>{t('account.email.changeTitle')}</DialogTitle>
            <DialogDescription>{t('account.email.changeDescription')}</DialogDescription>
          </DialogHeader>
          {errorKey ? (
            <Alert variant="destructive">
              <AlertDescription>{t(errorKey)}</AlertDescription>
            </Alert>
          ) : null}
          <form.Field name="email">
            {(field) => (
              <AuthField
                id="change-email"
                type="email"
                label={t('account.email.newEmail')}
                autoComplete="email"
                value={field.state.value}
                error={field.state.meta.isTouched ? firstError(field.state.meta.errors) : undefined}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t('editor.cancel')}
              </Button>
            </DialogClose>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {t('account.email.send')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
