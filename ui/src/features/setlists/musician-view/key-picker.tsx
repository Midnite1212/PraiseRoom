import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { conventionalKey, signedSemitones } from '@/features/chords/key-spelling';
import { keyLabel, type MusicKey } from '@/features/chords/theory';

type KeyPickerProps = {
  originalKey: MusicKey;
  playKey: MusicKey;
  onChange: (key: MusicKey) => void;
};

const formatOffset = (semitones: number): string =>
  semitones === 0 ? '0' : `${semitones > 0 ? '+' : '−'}${Math.abs(semitones)}`;

export function KeyPicker({ originalKey, playKey, onChange }: KeyPickerProps) {
  const { t } = useTranslation();
  const options = Array.from({ length: 12 }, (_, root) =>
    conventionalKey(root, originalKey.isMinor)
  );
  const offset = signedSemitones(originalKey, playKey);

  return (
    <Select
      value={String(playKey.root)}
      onValueChange={(value) => {
        const next = options[Number(value)];
        if (next) onChange(next);
      }}
    >
      <SelectTrigger size="sm" aria-label={t('reader.key')} className="gap-1.5 font-mono">
        <span className="text-muted-foreground font-sans text-xs">{t('reader.key')}</span>
        <span className="font-semibold">{keyLabel(playKey)}</span>
        <span className="bg-secondary text-secondary-foreground rounded px-1 text-[0.7rem]">
          {formatOffset(offset)}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.root} value={String(option.root)} className="font-mono">
            {keyLabel(option)}
            {option.root === originalKey.root ? (
              <span className="text-muted-foreground font-sans text-xs">
                {t('reader.original')}
              </span>
            ) : null}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
