import { Link, Navigate } from '@tanstack/react-router';
import { Mail } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

import {
  AUTH_FINE_CLASSES,
  AUTH_SUB_CLASSES,
  AUTH_SWITCH_CLASSES,
  AUTH_TITLE_CLASSES,
  AuthLayout,
} from './auth-layout';
import { readCheckEmailState } from './check-email-state';
import { resetRedirectUrl } from './forgot-page';

// "Check your email" after asking for a reset link or after signing up, with a way to send it again.
export function CheckEmailPage() {
  const { t } = useTranslation();
  const [state] = useState(readCheckEmailState);
  const [sending, setSending] = useState(false);

  if (!state) return <Navigate to="/forgot" replace />;
  const { email, kind } = state;

  const resend = async () => {
    setSending(true);
    try {
      if (kind === 'reset') {
        await authClient.requestPasswordReset({
          email,
          redirectTo: resetRedirectUrl(window.location.origin),
        });
      } else {
        await authClient.sendVerificationEmail(email);
      }
      toast.success(t('auth.checkEmail.sentAgain'));
    } catch {
      toast.error(t('auth.errors.failed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout>
      <span className="bg-fill-on [&_svg]:size-icon mb-[18px] grid size-[52px] place-items-center rounded-2xl">
        <Mail />
      </span>
      <h1 className={AUTH_TITLE_CLASSES}>{t('auth.checkEmail.title')}</h1>
      <p className={AUTH_SUB_CLASSES}>
        {t(kind === 'reset' ? 'auth.checkEmail.resetBody' : 'auth.checkEmail.verifyBody', {
          email,
        })}
      </p>
      <div className="grid gap-2.5">
        <Button
          variant="secondary"
          className="w-full"
          disabled={sending}
          onClick={() => void resend()}
        >
          {t('auth.checkEmail.sendAgain')}
        </Button>
        {kind === 'reset' ? (
          <Button asChild variant="secondary" className="w-full">
            <Link to="/forgot">{t('auth.checkEmail.differentEmail')}</Link>
          </Button>
        ) : null}
      </div>
      <p className={AUTH_FINE_CLASSES}>{t('auth.checkEmail.spam')}</p>
      <p className={AUTH_SWITCH_CLASSES}>
        <Button asChild variant="link" size="sm">
          <Link to="/login">{t('auth.backToSignIn')}</Link>
        </Button>
      </p>
    </AuthLayout>
  );
}
