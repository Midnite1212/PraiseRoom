import { describe, expect, it } from 'vitest';

import { describePassword, scorePassword } from './password-strength';

describe('scorePassword', () => {
  it('scores nothing for an empty password and 1 for a short one', () => {
    expect(scorePassword('')).toBe(0);
    expect(scorePassword('abc')).toBe(1);
    expect(scorePassword('1234567')).toBe(1);
  });

  it('gives 2 for eight plain letters or digits', () => {
    expect(scorePassword('abcdefgh')).toBe(2);
    expect(scorePassword('12345678')).toBe(2);
  });

  it('adds a point for twelve characters and one for mixing letters with other characters', () => {
    expect(scorePassword('abcdefghijkl')).toBe(3);
    expect(scorePassword('abcdefg1')).toBe(3);
    expect(scorePassword('a short sentence')).toBe(4);
    expect(scorePassword('abcdefghijk1')).toBe(4);
  });
});

describe('describePassword', () => {
  it('counts the characters still missing', () => {
    expect(describePassword('')).toEqual({ kind: 'empty' });
    expect(describePassword('abc')).toEqual({ kind: 'short', missing: 5 });
    expect(describePassword('1234567')).toEqual({ kind: 'short', missing: 1 });
  });

  it('names the strength once it is long enough', () => {
    expect(describePassword('abcdefgh')).toEqual({ kind: 'fair' });
    expect(describePassword('abcdefg1')).toEqual({ kind: 'good' });
    expect(describePassword('a short sentence')).toEqual({ kind: 'strong' });
  });
});
