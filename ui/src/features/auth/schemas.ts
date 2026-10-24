import { z } from 'zod';

import { MIN_PASSWORD_LENGTH } from './password-strength';

export const NAME_MAX_LENGTH = 60;

export type ValidationKey =
  | 'validation.nameRequired'
  | 'validation.emailRequired'
  | 'validation.emailInvalid'
  | 'validation.passwordRequired'
  | 'validation.newPasswordRequired'
  | 'validation.currentPasswordRequired'
  | 'validation.passwordShort'
  | 'validation.passwordMismatch';

type Translate = (key: ValidationKey) => string;

const emailField = (t: Translate) =>
  z
    .string()
    .trim()
    .min(1, t('validation.emailRequired'))
    .pipe(z.email(t('validation.emailInvalid')));

const nameField = (t: Translate) =>
  z.string().trim().min(1, t('validation.nameRequired')).max(NAME_MAX_LENGTH);

const newPasswordField = (t: Translate) =>
  z
    .string()
    .min(1, t('validation.newPasswordRequired'))
    .min(MIN_PASSWORD_LENGTH, t('validation.passwordShort'));

export const signInSchema = (t: Translate) =>
  z.object({
    email: emailField(t),
    password: z.string().min(1, t('validation.passwordRequired')),
  });

export const signUpSchema = (t: Translate) =>
  z.object({
    name: nameField(t),
    email: emailField(t),
    password: newPasswordField(t),
  });

export const forgotSchema = (t: Translate) => z.object({ email: emailField(t) });

export const changeEmailSchema = forgotSchema;

export const accountNameSchema = nameField;

export const resetSchema = (t: Translate) =>
  z
    .object({ password: newPasswordField(t), confirm: z.string() })
    .refine(({ password, confirm }) => password === confirm, {
      message: t('validation.passwordMismatch'),
      path: ['confirm'],
    });

export const changePasswordSchema = (t: Translate) =>
  z
    .object({
      current: z.string().min(1, t('validation.currentPasswordRequired')),
      password: newPasswordField(t),
      confirm: z.string(),
    })
    .refine(({ password, confirm }) => password === confirm, {
      message: t('validation.passwordMismatch'),
      path: ['confirm'],
    });
