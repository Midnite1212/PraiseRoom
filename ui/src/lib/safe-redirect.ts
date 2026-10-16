// Only same-origin paths; `//host` and absolute URLs would turn the login page into an open redirect.
export const toSafeRedirect = (value: unknown): string =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
