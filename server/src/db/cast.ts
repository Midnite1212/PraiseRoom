import { isObjectIdString } from '../utils/validation';
import { toObjectId } from './objectId';

export class InvalidInputError extends Error {
  constructor(readonly path: string) {
    super(`Invalid value for ${path}`);
    this.name = 'InvalidInputError';
  }
}

const MIN_DATE_YEAR = 1000;
const MAX_DATE_YEAR = 9999;

const isScalar = (value: unknown): value is string | number | boolean | bigint =>
  ['string', 'number', 'boolean', 'bigint'].includes(typeof value);

// Postgres text cannot store NUL, which MongoDB accepted.
export const hasNulCharacter = (value: string): boolean => value.includes('\u0000');

export const castOptionalString = (path: string, value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  if (!isScalar(value)) throw new InvalidInputError(path);
  const text = String(value);
  if (hasNulCharacter(text)) throw new InvalidInputError(path);
  return text;
};

export const castOptionalInteger = (
  path: string,
  value: unknown,
  { min, max }: { min: number; max: number }
): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const number = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof number !== 'number' || !Number.isInteger(number) || number < min || number > max) {
    throw new InvalidInputError(path);
  }
  return number;
};

export const castRequiredString = (path: string, value: unknown): string => {
  const cast = castOptionalString(path, value);
  if (cast === null || cast === '') throw new InvalidInputError(path);
  return cast;
};

const castArrayItem = (path: string, value: unknown, isRequired: boolean): string => {
  const cast = castOptionalString(path, value);
  if (cast === null || (isRequired && cast === '')) throw new InvalidInputError(path);
  return cast;
};

export const castStringArray = (
  path: string,
  value: unknown,
  { itemsRequired = false } = {}
): string[] => {
  if (value === undefined || value === null) return [];
  const items: unknown[] = Array.isArray(value) ? value : [value];
  return items.map((item) => castArrayItem(path, item, itemsRequired));
};

export const castObjectId = (path: string, value: unknown): string => {
  if (!isObjectIdString(value)) throw new InvalidInputError(path);
  return toObjectId(value);
};

export const castObjectIdArray = (path: string, value: unknown): string[] => {
  if (value === undefined || value === null) return [];
  const items: unknown[] = Array.isArray(value) ? value : [value];
  return items.map((item) => castObjectId(path, item));
};

export const castDate = (path: string, value: unknown): Date | null => {
  if (value === undefined || value === null || value === '') return null;
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
    throw new InvalidInputError(path);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new InvalidInputError(path);
  // Outside these years Postgres rejects the value or Drizzle reads it back shifted by centuries.
  const year = date.getUTCFullYear();
  if (year < MIN_DATE_YEAR || year > MAX_DATE_YEAR) throw new InvalidInputError(path);
  return date;
};

export const has = <K extends string>(fields: Partial<Record<K, unknown>>, key: K): boolean =>
  Object.prototype.hasOwnProperty.call(fields, key);
