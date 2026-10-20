import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LYRICS_SIZES, useLyricsSize } from '@/features/reader/lyrics-size';
import { TYPEFACES, useTypeface } from '@/lib/typeface';
import { cn } from '@/lib/utils';

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T =>
  values.some((option) => option === value);

const SELECTED = 'data-[state=on]:border-primary data-[state=on]:bg-accent';

export function SettingsPage() {
  const { t } = useTranslation();
  const [typeface, setTypeface] = useTypeface();
  const [lyricsSize, setLyricsSize] = useLyricsSize();

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.font.title')}</CardTitle>
          <CardDescription>{t('settings.font.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            variant="outline"
            value={typeface}
            onValueChange={(value) => {
              if (isOneOf(TYPEFACES, value)) setTypeface(value);
            }}
            aria-label={t('settings.font.title')}
            className="grid w-full grid-cols-1 sm:grid-cols-2"
          >
            {TYPEFACES.map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                data-typeface={option}
                className={cn('h-auto flex-col items-start gap-1 px-4 py-3 font-sans', SELECTED)}
              >
                <span className="text-base">{t(`settings.font.options.${option}`)}</span>
                <span className="text-muted-foreground text-sm font-normal">
                  {t('settings.font.sample')}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.textSize.title')}</CardTitle>
          <CardDescription>{t('settings.textSize.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ToggleGroup
            type="single"
            variant="outline"
            value={lyricsSize}
            onValueChange={(value) => {
              if (isOneOf(LYRICS_SIZES, value)) setLyricsSize(value);
            }}
            aria-label={t('settings.textSize.title')}
            className="grid w-full grid-cols-5"
          >
            {LYRICS_SIZES.map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                data-lyrics-size={option}
                aria-label={t(`settings.textSize.options.${option}`)}
                className={cn('text-lyrics h-14 font-normal', SELECTED)}
              >
                Aa
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p
            data-lyrics-size={lyricsSize}
            className="bg-sheet text-sheet-foreground font-lyrics text-lyrics rounded-xl border p-4"
          >
            {t('settings.textSize.preview')}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
