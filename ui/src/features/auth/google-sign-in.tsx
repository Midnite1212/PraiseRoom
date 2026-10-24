import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

// A "G" drawn on the pixelarticons grid; Google's own mark is not part of the icon set.
export function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 4h10v2H7zM5 6h2v12H5zM7 18h10v2H7zM17 13h2v5h-2zM12 11h7v2h-7zM17 6h2v2h-2z" />
    </svg>
  );
}

// "Continue with Google", then the "or with email" rule that separates it from the form.
export function GoogleSignIn({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Button variant="secondary" className="w-full" disabled={disabled} onClick={onClick}>
        <GoogleMark />
        {label}
      </Button>
      <div className="text-ink-3 my-[18px] flex items-center gap-3 text-[0.8125rem]">
        <span aria-hidden className="bg-hairline h-px flex-1" />
        {t('auth.orWithEmail')}
        <span aria-hidden className="bg-hairline h-px flex-1" />
      </div>
    </>
  );
}
