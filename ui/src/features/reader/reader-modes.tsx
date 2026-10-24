import { ArrowsHorizontal } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useIsWide } from '@/hooks/use-wide';

import { useReaderMode } from './chord-display';
import { ReaderModeToggle } from './reader-controls';
import { toggleReaderWidth, useReaderWidth } from './reader-width';

// The top row's Lyrics | Chords and, on wide screens, the Full width toggle.
export function ReaderModes() {
  const { t } = useTranslation();
  const [mode, setMode] = useReaderMode();
  const [width, setWidth] = useReaderWidth();
  const isWide = useIsWide();
  const label = t('reader.fullWidth');
  return (
    <>
      <ReaderModeToggle mode={mode} onChange={setMode} />
      {isWide ? (
        <Button
          variant="glass"
          size="icon-lg"
          aria-label={label}
          aria-pressed={width === 'full'}
          onClick={() => setWidth(toggleReaderWidth(width))}
          className="aria-pressed:[--glass-fill:color-mix(in_oklch,var(--chord)_28%,var(--glass-tint))]"
        >
          <ArrowsHorizontal />
        </Button>
      ) : null}
    </>
  );
}
