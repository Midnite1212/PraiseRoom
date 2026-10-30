import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SONG_THEMES } from '../db/schema';
import { THEME_KEYWORDS, deriveSongThemes, isSongTheme, mergeThemes } from './songThemes';

describe('songThemes', () => {
  it('recognises only the fixed theme list', () => {
    for (const theme of SONG_THEMES) assert.ok(isSongTheme(theme), theme);
    for (const value of ['Joy', 'hope', '', 'The Cross ', 'Worship / Adoration']) {
      assert.ok(!isSongTheme(value), value);
    }
  });

  it('derives every theme from each of its own keywords in a title', () => {
    for (const theme of SONG_THEMES) {
      const keywords = THEME_KEYWORDS[theme];
      assert.ok(keywords.length > 0, theme);
      for (const keyword of keywords) {
        assert.ok(deriveSongThemes(keyword, '').includes(theme), `${theme}: ${keyword}`);
      }
    }
  });

  it('needs two different keywords in the lyrics, however often one repeats', () => {
    assert.deepEqual(deriveSongThemes('', 'hope, hope, hope and hope'), []);
    assert.deepEqual(deriveSongThemes('', 'hope and heaven'), ['Hope']);
  });

  it('strips section labels and inline chords before matching', () => {
    const chart =
      '{Chorus}\n[G]At the cr[D]oss, [C]Cal[G]vary\n{Bridge}\n[C]Than[G]k You, so gra[D]teful';
    assert.deepEqual(deriveSongThemes('', chart), ['Thankfulness/Gratitude', 'The Cross']);
  });

  it('matches Latin phrases as whole words, ignoring case, punctuation, and curly apostrophes', () => {
    assert.deepEqual(deriveSongThemes('Hopeless', ''), []);
    assert.deepEqual(deriveSongThemes('HOPE!', ''), ['Hope']);
    assert.deepEqual(deriveSongThemes('GOD’S FAMILY', ''), ['Church / Unity']);
    assert.deepEqual(deriveSongThemes('all-powerful', ''), ['Attributes of God']);
    assert.deepEqual(deriveSongThemes('', 'come\nlet us; o come'), ['Call to Worship']);
  });

  it('matches Chinese keywords inside a line, even with chords between characters', () => {
    assert.deepEqual(deriveSongThemes('', '[C]十[G]字架 寶血'), ['The Cross']);
    assert.deepEqual(deriveSongThemes('聖靈請你來', ''), ['Holy Spirit']);
  });

  it('returns each theme once, in list order', () => {
    assert.deepEqual(deriveSongThemes('Risen', '[D]The cross, Calvary. Risen indeed!'), [
      'Resurrection',
      'The Cross',
    ]);
  });

  it('derives nothing from an empty or chord-only chart', () => {
    assert.deepEqual(deriveSongThemes('', ''), []);
    assert.deepEqual(deriveSongThemes('', '{Intro}\n[C] [G] [Am] [F]'), []);
    assert.deepEqual(deriveSongThemes('La', '[C]La'), []);
  });

  it('merges derived themes after the existing ones without duplicates', () => {
    assert.deepEqual(mergeThemes(['Hope', 'Prayer', 'Hope'], ['Prayer', 'The Cross']), [
      'Hope',
      'Prayer',
      'The Cross',
    ]);
    assert.deepEqual(mergeThemes([], []), []);
  });
});
