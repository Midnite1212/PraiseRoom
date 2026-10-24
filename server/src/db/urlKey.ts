import { randomInt } from 'node:crypto';

const URL_KEY_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const URL_KEY_LENGTH = 6;

export const generateUrlKey = (): string =>
  Array.from({ length: URL_KEY_LENGTH }, () =>
    URL_KEY_ALPHABET.charAt(randomInt(URL_KEY_ALPHABET.length))
  ).join('');
