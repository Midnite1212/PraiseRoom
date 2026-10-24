import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { accountNameSchema, NAME_MAX_LENGTH } from '@/features/auth/schemas';
import { type Session, sessionQueryOptions } from '@/features/auth/session';
import { SettingsGroup, SettingsRow } from '@/features/settings/settings-group';
import { useAutosave } from '@/hooks/use-autosave';
import { clearAuthToken } from '@/lib/api-client';

import { renameAccount } from './api';
import { ChangeEmailDialog } from './change-email-dialog';

// The name field's draft and its autosave, held by the page so the Saved chip can sit in the page header.
export function useProfileName(session: Session) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [draft, setDraft] = useState(session.fullName);
  const [touched, setTouched] = useState(false);
  const isValid = accountNameSchema((key) => t(key)).safeParse(draft).success;

  const rename = useMutation({
    mutationFn: (name: string) => renameAccount(session.ownership._id, name),
    onSuccess: async () => {
      clearAuthToken();
      await queryClient.invalidateQueries({ queryKey: sessionQueryOptions.queryKey });
      await router.invalidate();
    },
  });
  const { status, retry } = useAutosave({
    value: draft.trim(),
    save: rename.mutateAsync,
    enabled: isValid,
  });

  return { draft, setDraft, touched, setTouched, isValid, status, retry };
}

export type ProfileName = ReturnType<typeof useProfileName>;

// The name saves as you type; the email changes through a confirmation link.
export function ProfileSection({ session, name }: { session: Session; name: ProfileName }) {
  const { t } = useTranslation();
  const { draft, setDraft, touched, setTouched, isValid } = name;
  const [emailOpen, setEmailOpen] = useState(false);
  const showError = touched && !isValid;

  return (
    <SettingsGroup id="account-profile" title={t('account.profile.title')}>
      <SettingsRow
        label={<label htmlFor="account-name">{t('account.profile.name')}</label>}
        hint={t('account.profile.nameHint')}
      >
        <span className="flex items-center gap-3">
          <input
            id="account-name"
            value={draft}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="name"
            aria-invalid={showError}
            aria-describedby={showError ? 'account-name-error' : undefined}
            onChange={(event) => {
              setTouched(true);
              setDraft(event.target.value);
            }}
            className="bg-fill-hover wide:max-w-[300px] wide:flex-none wide:w-[300px] h-12 min-w-0 flex-1 rounded-[14px] px-3.5 text-base shadow-[inset_0_0_0_1px_var(--hairline)] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] aria-invalid:shadow-[inset_0_0_0_2px_var(--destructive)]"
          />
        </span>
        {showError ? (
          <small id="account-name-error" role="alert" className="text-destructive mt-1.5 block">
            {t('validation.nameRequired')}
          </small>
        ) : null}
      </SettingsRow>
      <SettingsRow label={t('account.email.title')} hint={t('account.email.hint')}>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 break-all">{session.email}</span>
          <Button variant="link" size="sm" onClick={() => setEmailOpen(true)}>
            {t('account.email.change')}
          </Button>
        </span>
      </SettingsRow>
      <ChangeEmailDialog open={emailOpen} onOpenChange={setEmailOpen} />
    </SettingsGroup>
  );
}
