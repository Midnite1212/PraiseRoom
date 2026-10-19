import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { ClipboardPaste } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

import { convertImportedChart, type ImportedChart } from './api';
import { convertErrorKey } from './import-errors';

type PasteChartFormProps = {
  onImported: (chart: ImportedChart) => void;
};

export function PasteChartForm({ onImported }: PasteChartFormProps) {
  const { t } = useTranslation();

  const schema = z.object({ text: z.string().trim().min(1, t('songImport.paste.textRequired')) });

  const convertChart = useMutation({ mutationFn: convertImportedChart, onSuccess: onImported });

  const form = useForm({
    defaultValues: { text: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        await convertChart.mutateAsync(value.text);
      } catch {
        // Surfaced via convertChart.isError below.
      }
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {convertChart.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{t(convertErrorKey(convertChart.error))}</AlertDescription>
        </Alert>
      ) : null}

      <form.Field name="text">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>{t('songImport.paste.label')}</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                rows={10}
                value={field.state.value}
                aria-invalid={isInvalid}
                placeholder={t('songImport.paste.placeholder')}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
            </Field>
          );
        }}
      </form.Field>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting} className="self-start">
            <ClipboardPaste />
            {t('songImport.paste.button')}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
