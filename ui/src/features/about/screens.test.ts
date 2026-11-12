import { describe, expect, it } from 'vitest';

import { screenForPath } from './screens';

describe('screenForPath', () => {
  it('maps the app pages a preview links to onto preview screens', () => {
    expect(screenForPath('/')).toBe('setlists');
    expect(screenForPath('/songs')).toBe('library');
    expect(screenForPath('/songs/amazing-grace-dmag01')).toBe('chart');
    expect(screenForPath('/setlists/')).toBe('setlists');
    expect(screenForPath('/setlists/sunday-service-dmsun1')).toBe('musician');
    expect(screenForPath('/folders/sunday-band-dmfold')).toBe('sharing');
    expect(screenForPath('/setlist/view/sunday-service-dmsun1')).toBe('public');
  });

  it('has no stand-in for pages outside the demo', () => {
    expect(screenForPath('/settings')).toBeNull();
    expect(screenForPath('/account/password')).toBeNull();
  });
});
