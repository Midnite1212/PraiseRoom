import { ApiError } from '@/lib/api-client';

export type ImportErrorKey =
  | 'songImport.errors.unsupportedLink'
  | 'songImport.errors.noChart'
  | 'songImport.errors.siteUnavailable'
  | 'songImport.errors.invalidText'
  | 'songImport.errors.generic';

// Maps `POST /api/songs/import/fetch` failures to a translated message; never render server text.
export const fetchErrorKey = (error: unknown): ImportErrorKey => {
  if (error instanceof ApiError) {
    if (error.status === 400) return 'songImport.errors.unsupportedLink';
    if (error.status === 422) return 'songImport.errors.noChart';
    if (error.status === 502) return 'songImport.errors.siteUnavailable';
  }
  return 'songImport.errors.generic';
};

// Maps `POST /api/songs/import/convert` failures to a translated message.
export const convertErrorKey = (error: unknown): ImportErrorKey => {
  if (error instanceof ApiError) {
    if (error.status === 422) return 'songImport.errors.noChart';
    if (error.status === 400) return 'songImport.errors.invalidText';
  }
  return 'songImport.errors.generic';
};
