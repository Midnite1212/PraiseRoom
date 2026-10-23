export const MAX_KEYWORD_LENGTH = 100;

// Chord-site links often carry tracking or capo query strings that aren't needed to import them.
export const toSearchKeyword = (input: string): string => {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return trimmed;
  }
};
