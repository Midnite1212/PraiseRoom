import { useForm } from '@tanstack/react-form';
import { Check, Send } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Segmented } from '@/components/primitives/segmented';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { SectionHead } from './section-head';

const KINDS = ['bug', 'idea', 'question'] as const;

type FeedbackValues = { kind: (typeof KINDS)[number]; message: string; email: string };

const EMPTY_FEEDBACK: FeedbackValues = { kind: 'bug', message: '', email: '' };

function FeedbackForm({ onSent }: { onSent: () => void }) {
  const { t } = useTranslation();
  const schema = z.object({
    kind: z.enum(KINDS),
    message: z.string().trim().min(1, t('about.feedback.form.messageRequired')),
    email: z.union([z.literal(''), z.email(t('validation.emailInvalid'))]),
  });
  const form = useForm({
    defaultValues: EMPTY_FEEDBACK,
    validators: { onSubmit: schema },
    onSubmit: onSent,
  });

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="kind">
        {(field) => (
          <FieldSet>
            <FieldLegend variant="label">{t('about.feedback.form.kindLegend')}</FieldLegend>
            <Segmented
              value={field.state.value}
              onChange={field.handleChange}
              label={t('about.feedback.form.kindLegend')}
              options={KINDS.map((kind) => ({
                value: kind,
                label: t(`about.feedback.form.kinds.${kind}`),
              }))}
            />
          </FieldSet>
        )}
      </form.Field>
      <form.Field name="message">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="feedback-message">{t('about.feedback.form.message')}</FieldLabel>
              <Textarea
                id="feedback-message"
                rows={5}
                value={field.state.value}
                placeholder={t('about.feedback.form.messagePlaceholder')}
                aria-invalid={isInvalid}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
            </Field>
          );
        }}
      </form.Field>
      <form.Field name="email">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="feedback-email">{t('about.feedback.form.email')}</FieldLabel>
              <Input
                id="feedback-email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                placeholder={t('about.feedback.form.emailPlaceholder')}
                aria-invalid={isInvalid}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldDescription>{t('about.feedback.form.emailHint')}</FieldDescription>
              {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
            </Field>
          );
        }}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" className="wide:justify-self-start" disabled={isSubmitting}>
            <Send />
            {t('about.feedback.form.submit')}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export function FeedbackSection() {
  const { t } = useTranslation();
  const [isSent, setIsSent] = useState(false);
  return (
    <section
      id="feedback"
      aria-labelledby="feedback-title"
      className="wide:px-10 mx-auto max-w-[1320px] scroll-mt-16 px-(--pg) pt-28"
    >
      <div className="roomy:grid roomy:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] roomy:gap-12">
        <SectionHead
          id="feedback-title"
          eyebrow={t('about.feedback.eyebrow')}
          title={t('about.feedback.title')}
          chords={['Em', 'D', 'C']}
          lede={t('about.feedback.lede')}
        />
        <div className="glass glass-strong wide:p-8 p-5 [--glass-r:28px]">
          {isSent ? (
            <output className="m-0 flex min-h-40 items-center justify-center gap-3 text-center text-lg font-semibold">
              <Check className="text-ok size-6" />
              {t('about.feedback.form.thanksTitle')}
            </output>
          ) : (
            <FeedbackForm onSent={() => setIsSent(true)} />
          )}
        </div>
      </div>
    </section>
  );
}
