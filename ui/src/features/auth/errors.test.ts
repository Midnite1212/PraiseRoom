import { describe, expect, it } from 'vitest';

import { AuthError } from '@/lib/auth-client';

import { toAuthErrorKey } from './errors';

describe('toAuthErrorKey', () => {
  it('maps Better Auth codes to keys', () => {
    expect(toAuthErrorKey(new AuthError(403, 'EMAIL_NOT_VERIFIED'))).toBe(
      'auth.errors.verifyEmail'
    );
    expect(toAuthErrorKey(new AuthError(401, 'INVALID_EMAIL_OR_PASSWORD'))).toBe(
      'auth.errors.invalidCredentials'
    );
    expect(toAuthErrorKey(new AuthError(422, 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'))).toBe(
      'auth.errors.emailTaken'
    );
    expect(toAuthErrorKey(new AuthError(400, 'INVALID_PASSWORD'))).toBe(
      'auth.errors.wrongPassword'
    );
    expect(toAuthErrorKey(new AuthError(400, 'INVALID_TOKEN'))).toBe('auth.errors.invalidToken');
    expect(toAuthErrorKey(new AuthError(400, 'FAILED_TO_UNLINK_LAST_ACCOUNT'))).toBe(
      'auth.errors.lastLogin'
    );
  });

  it('maps rate limits and a bare 401, and falls back for the rest', () => {
    expect(toAuthErrorKey(new AuthError(429))).toBe('auth.errors.tooMany');
    expect(toAuthErrorKey(new AuthError(401))).toBe('auth.errors.invalidCredentials');
    expect(toAuthErrorKey(new AuthError(500, 'SOMETHING'))).toBe('auth.errors.failed');
    expect(toAuthErrorKey(new TypeError('network'))).toBe('auth.errors.failed');
  });
});
