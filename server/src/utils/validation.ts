const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const isUserIdString = (value: unknown): value is string =>
  typeof value === 'string' && USER_ID_PATTERN.test(value);

export const isObjectIdString = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID_PATTERN.test(value);

export const toObjectIdList = (value: unknown): string[] | null => {
  if (value === undefined || value === null) return [];
  const items: unknown[] = Array.isArray(value) ? value : [value];
  if (!items.every(isObjectIdString)) return null;
  return Array.from(new Set(items.map((id) => id.toLowerCase())));
};
