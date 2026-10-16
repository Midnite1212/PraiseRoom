import { useForm } from '@tanstack/react-form';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const searchSchema = z.object({ keyword: z.string().trim().max(100) });

type SongSearchFormProps = {
  keyword: string;
  onSearch: (keyword: string) => void;
};

export function SongSearchForm({ keyword, onSearch }: SongSearchFormProps) {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: { keyword },
    validators: { onSubmit: searchSchema },
    onSubmit: ({ value }) => onSearch(value.keyword.trim()),
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
          {(field) => (
            <Field className="max-w-sm flex-1">
              <FieldLabel htmlFor={field.name} className="sr-only">
                {t('songs.searchLabel')}
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="search"
                value={field.state.value}
                placeholder={t('songs.searchPlaceholder')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </Field>
          )}
        </form.Field>
        <Button type="submit">
          <Search />
          {t('songs.search')}
        </Button>
      </form>
    </search>
  );
}
