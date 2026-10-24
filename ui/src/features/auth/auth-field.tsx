import { Eye, EyeOff } from 'pixelarticons/react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import { describePassword, PASSWORD_METER_PIXELS, scorePassword } from './password-strength';

type FieldErrors = ReadonlyArray<{ message?: string } | undefined>;

export const firstError = (errors: FieldErrors): string | undefined =>
  errors.find((error) => error?.message)?.message;

// Four pixels that light up as a new password gets stronger, with a line saying how it stands.
export function PasswordMeter({ value }: { value: string }) {
  const { t } = useTranslation();
  const score = scorePassword(value);
  const hint = describePassword(value);
  return (
    <>
      <span aria-hidden className="mt-0.5 flex gap-1">
        {Array.from({ length: PASSWORD_METER_PIXELS }, (_, index) => (
          <i
            key={index}
            className={cn(
              'bg-pixel-off h-1 flex-1 transition-colors duration-200 ease-out',
              index < score &&
                (score < 2
                  ? 'bg-destructive/70'
                  : 'bg-pixel-on shadow-[0_1px_6px_var(--pixel-glow)]')
            )}
          />
        ))}
      </span>
      <small aria-live="polite" className="text-ink-3 text-[0.8125rem]">
        {hint.kind === 'short'
          ? t('auth.strength.short', { count: hint.missing })
          : t(`auth.strength.${hint.kind}`)}
      </small>
    </>
  );
}

type AuthFieldProps = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  // Shows the strength meter under a new password.
  meter?: boolean;
  // A small link or button at the end of the label row ("Forgot it?").
  action?: ReactNode;
};

// The one field of the account and signed-out pages: label, the input (with a show/hide button for
// passwords), an inline error, and for new passwords the strength meter.
export function AuthField({
  id,
  label,
  type = 'text',
  autoComplete,
  value,
  onChange,
  onBlur,
  error,
  meter = false,
  action,
}: AuthFieldProps) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const toggleLabel = revealed ? t('auth.hidePassword') : t('auth.showPassword');

  return (
    <Field data-invalid={Boolean(error)} className="gap-1.5">
      <div className="flex min-h-6 items-center justify-between">
        <FieldLabel htmlFor={id} className="text-ink-2 text-sm font-semibold">
          {label}
        </FieldLabel>
        {action}
      </div>
      <span className="bg-fill-hover flex h-12 items-center rounded-[14px] pr-1 pl-3.5 shadow-[inset_0_0_0_1px_var(--hairline)] transition-shadow duration-150 ease-out focus-within:shadow-[inset_0_0_0_2px_var(--ring)] has-aria-invalid:shadow-[inset_0_0_0_2px_var(--destructive)]">
        <input
          id={id}
          name={id}
          type={isPassword && revealed ? 'text' : type}
          autoComplete={autoComplete}
          spellCheck={false}
          value={value}
          aria-invalid={Boolean(error)}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-base outline-none"
        />
        {isPassword ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={() => setRevealed((current) => !current)}
          >
            {revealed ? <EyeOff /> : <Eye />}
          </Button>
        ) : null}
      </span>
      {meter ? <PasswordMeter value={value} /> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
