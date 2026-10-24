import { describe, expect, it } from 'vitest';

import {
  accountNameSchema,
  changeEmailSchema,
  changePasswordSchema,
  forgotSchema,
  resetSchema,
  signInSchema,
  signUpSchema,
  type ValidationKey,
} from './schemas';

const t = (key: ValidationKey): string => key;

const messagesAt = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) =>
  Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [String(issue.path[0]), issue.message])
  );

describe('signInSchema', () => {
  it('asks for an email and a password', () => {
    expect(messagesAt(signInSchema(t).safeParse({ email: '', password: '' }))).toEqual({
      email: 'validation.emailRequired',
      password: 'validation.passwordRequired',
    });
  });

  it('rejects a malformed email and accepts a surrounding space', () => {
    expect(messagesAt(signInSchema(t).safeParse({ email: 'nope', password: 'x' }))).toEqual({
      email: 'validation.emailInvalid',
    });
    expect(signInSchema(t).safeParse({ email: ' a@example.com ', password: 'x' }).success).toBe(
      true
    );
  });
});

describe('signUpSchema', () => {
  it('needs a name, an email and eight characters', () => {
    expect(
      messagesAt(
        signUpSchema(t).safeParse({ name: '  ', email: 'a@example.com', password: 'short' })
      )
    ).toEqual({ name: 'validation.nameRequired', password: 'validation.passwordShort' });
    expect(
      signUpSchema(t).safeParse({ name: 'Test', email: 'a@example.com', password: '12345678' })
        .success
    ).toBe(true);
  });
});

describe('forgotSchema and changeEmailSchema', () => {
  it('validate one email', () => {
    expect(messagesAt(forgotSchema(t).safeParse({ email: 'a' }))).toEqual({
      email: 'validation.emailInvalid',
    });
    expect(changeEmailSchema(t).safeParse({ email: 'a@example.com' }).success).toBe(true);
  });
});

describe('resetSchema', () => {
  it('flags a short password and a mismatch on the confirm field', () => {
    expect(messagesAt(resetSchema(t).safeParse({ password: 'abc', confirm: 'abc' }))).toEqual({
      password: 'validation.passwordShort',
    });
    expect(
      messagesAt(resetSchema(t).safeParse({ password: 'long enough', confirm: 'long enough!' }))
    ).toEqual({ confirm: 'validation.passwordMismatch' });
    expect(
      resetSchema(t).safeParse({ password: 'long enough', confirm: 'long enough' }).success
    ).toBe(true);
  });
});

describe('changePasswordSchema', () => {
  it('needs the current password, a long new one and a matching confirmation', () => {
    expect(
      messagesAt(
        changePasswordSchema(t).safeParse({ current: '', password: 'abc', confirm: 'abc' })
      )
    ).toEqual({
      current: 'validation.currentPasswordRequired',
      password: 'validation.passwordShort',
    });
    expect(
      changePasswordSchema(t).safeParse({
        current: 'old',
        password: 'long enough',
        confirm: 'long enough',
      }).success
    ).toBe(true);
  });
});

describe('accountNameSchema', () => {
  it('trims, requires a name and caps its length', () => {
    expect(accountNameSchema(t).parse('  Test  ')).toBe('Test');
    expect(accountNameSchema(t).safeParse('   ').success).toBe(false);
    expect(accountNameSchema(t).safeParse('x'.repeat(61)).success).toBe(false);
  });
});
