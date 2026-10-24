const SLUG_WITH_URL_KEY = /(?:^|-)([0-9a-z]{6})$/i;
const MAX_SLUG_LENGTH = 60;

// Letters in any script (Chinese included) and digits survive; every other run becomes one hyphen.
export const toSlug = (text: string): string =>
  Array.from(
    text
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
  )
    .slice(0, MAX_SLUG_LENGTH)
    .join('')
    .replace(/-+$/, '');

export const withUrlKey = (name: string, urlKey: string): string => {
  const slug = toSlug(name);
  return slug ? `${slug}-${urlKey}` : urlKey;
};

export const urlKeyFromSlug = (slug: string): string | null =>
  SLUG_WITH_URL_KEY.exec(slug)?.[1]?.toLowerCase() ?? null;
