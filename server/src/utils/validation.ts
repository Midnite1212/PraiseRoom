const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{24}$/;
const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const URL_KEY_PATTERN = /^[0-9a-z]{6}$/;

export const isUserIdString = (value: unknown): value is string =>
  typeof value === 'string' && USER_ID_PATTERN.test(value);

export const isInviteToken = (value: unknown): value is string =>
  typeof value === 'string' && INVITE_TOKEN_PATTERN.test(value);

export const isObjectIdString = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID_PATTERN.test(value);

export const isUrlKeyString = (value: unknown): value is string =>
  typeof value === 'string' && URL_KEY_PATTERN.test(value);

export const toObjectIdList = (value: unknown): string[] | null => {
  if (value === undefined || value === null) return [];
  const items: unknown[] = Array.isArray(value) ? value : [value];
  if (!items.every(isObjectIdString)) return null;
  return Array.from(new Set(items.map((id) => id.toLowerCase())));
};
