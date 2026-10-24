export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_METER_PIXELS = 4;

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export type PasswordHint =
  | { kind: 'empty' }
  | { kind: 'short'; missing: number }
  | { kind: 'fair' }
  | { kind: 'good' }
  | { kind: 'strong' };

// Under 8 characters is weak (1), 8 or more is 2, plus one for 12 or more and one for mixing letters
// with other characters.
export const scorePassword = (value: string): PasswordScore => {
  if (value === '') return 0;
  if (value.length < MIN_PASSWORD_LENGTH) return 1;
  const longer = value.length >= 12 ? 1 : 0;
  const mixed = /[a-z]/i.test(value) && /[^a-z]/i.test(value) ? 1 : 0;
  const score = 2 + longer + mixed;
  return score >= 4 ? 4 : score === 3 ? 3 : 2;
};

export const describePassword = (value: string): PasswordHint => {
  const score = scorePassword(value);
  if (score === 0) return { kind: 'empty' };
  if (score === 1) return { kind: 'short', missing: MIN_PASSWORD_LENGTH - value.length };
  if (score === 4) return { kind: 'strong' };
  return score === 3 ? { kind: 'good' } : { kind: 'fair' };
};
