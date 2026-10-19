const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const MAX_BYTES = 3_000_000;
const MAX_REDIRECTS = 3;

export const ALLOWED_HOSTS = new Set([
  'www.worshiptogether.com',
  'worshiptogether.com',
  'tabs.ultimate-guitar.com',
  'www.ultimate-guitar.com',
  'pnwchords.com',
  'www.pnwchords.com',
  'songbpm.com',
  'itunes.apple.com',
]);

export class UpstreamError extends Error {
  constructor(
    readonly kind: 'blocked' | 'unavailable' | 'not-found',
    message: string
  ) {
    super(message);
  }
}

export const isAllowedUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname) && url.port === '';
  } catch {
    return false;
  }
};

type FetchOptions = { method?: 'GET' | 'POST'; form?: string; timeoutMs?: number };
export type FetchedPage = { status: number; url: string; body: string; location: string | null };

const readCapped = async (response: Response): Promise<string> => {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new UpstreamError('unavailable', 'Response too large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
};

// Fetches an allowlisted https page, following redirects only to other allowlisted hosts.
export const fetchPage = async (
  target: string,
  options: FetchOptions = {}
): Promise<FetchedPage> => {
  let url = target;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isAllowedUrl(url)) throw new UpstreamError('blocked', 'Host not allowed');
    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/json',
          ...(options.form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        },
        body: options.form,
        signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
      });
    } catch {
      throw new UpstreamError('unavailable', 'Request failed');
    }
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      if (options.method === 'POST') return { status: response.status, url, body: '', location };
      url = new URL(location, url).href;
      continue;
    }
    if (response.status === 404) throw new UpstreamError('not-found', 'Not found');
    if (!response.ok) throw new UpstreamError('unavailable', `Status ${response.status}`);
    return { status: response.status, url, body: await readCapped(response), location };
  }
  throw new UpstreamError('unavailable', 'Too many redirects');
};
