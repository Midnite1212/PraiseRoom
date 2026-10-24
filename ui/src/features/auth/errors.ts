import { AuthError } from '@/lib/auth-client';

export type AuthErrorKey =
  | 'auth.errors.invalidCredentials'
  | 'auth.errors.verifyEmail'
  | 'auth.errors.emailTaken'
  | 'auth.errors.wrongPassword'
  | 'auth.errors.invalidToken'
  | 'auth.errors.tooMany'
  | 'auth.errors.freshSession'
  | 'auth.errors.lastLogin'
  | 'auth.errors.failed';

// Maps a failed auth call to a translation key; the server's own text is never shown.
export const toAuthErrorKey = (error: unknown): AuthErrorKey => {
  if (!(error instanceof AuthError)) return 'auth.errors.failed';
  if (error.status === 429) return 'auth.errors.tooMany';
  switch (error.code) {
    case 'EMAIL_NOT_VERIFIED':
      return 'auth.errors.verifyEmail';
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'auth.errors.invalidCredentials';
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
    case 'EMAIL_ALREADY_EXISTS':
      return 'auth.errors.emailTaken';
    case 'INVALID_PASSWORD':
      return 'auth.errors.wrongPassword';
    case 'INVALID_TOKEN':
      return 'auth.errors.invalidToken';
    case 'SESSION_NOT_FRESH':
    case 'FRESH_SESSION_REQUIRED':
      return 'auth.errors.freshSession';
    case 'FAILED_TO_UNLINK_LAST_ACCOUNT':
      return 'auth.errors.lastLogin';
    default:
      return error.status === 401 && error.code === undefined
        ? 'auth.errors.invalidCredentials'
        : 'auth.errors.failed';
  }
};
