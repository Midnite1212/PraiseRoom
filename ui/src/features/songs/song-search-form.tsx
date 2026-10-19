import { useForm } from '@tanstack/react-form';
import { Search } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const MAX_KEYWORD_LENGTH = 100;

// Chord-site links often carry tracking or capo query strings that aren't needed to import them.
const withoutLinkQuery = (keyword: string): string => {
  const trimmed = keyword.trim();
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return trimmed;
  }
};

type SongSearchFormProps = {
  keyword: string;
  onSearch: (keyword: string) => void;
  canSearchWeb: boolean;
  web: boolean;
  onWebChange: (web: boolean) => void;
};

export function SongSearchForm({
  keyword,
  onSearch,
  canSearchWeb,
  web,
  onWebChange,
}: SongSearchFormProps) {
  const { t } = useTranslation();
  const searchSchema = z.object({
    keyword: z
      .string()
      .transform(withoutLinkQuery)
      .pipe(z.string().max(MAX_KEYWORD_LENGTH, t('songs.searchTooLong'))),
  });
  const form = useForm({
    defaultValues: { keyword },
    validators: { onSubmit: searchSchema },
    onSubmit: ({ value }) => onSearch(withoutLinkQuery(value.keyword)),
  });

  return (
    <search>
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="keyword">
          {(field) => {
            const isInvalid = !field.state.meta.isValid;
            return (
              <Field className="max-w-sm flex-1" data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name} className="sr-only">
                  {t('songs.searchLabel')}
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="search"
                  value={field.state.value}
                  placeholder={t('songs.searchPlaceholder')}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            );
          }}
        </form.Field>
        <Button type="submit">
          <Search />
          {t('songs.search')}
        </Button>
      </form>
      {canSearchWeb ? (
        <div className="mt-1.5 flex items-center gap-2">
          <Switch id="search-web" checked={web} onCheckedChange={onWebChange} />
          <Label htmlFor="search-web" className="text-muted-foreground font-normal">
            {t('songs.searchWeb')}
          </Label>
        </div>
      ) : null}
    </search>
  );
}
