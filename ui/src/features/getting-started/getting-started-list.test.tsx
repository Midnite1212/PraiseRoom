import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/test/render-with-router';

import { GettingStartedList } from './getting-started-list';
import { GETTING_STARTED_STEPS } from './steps';

describe('GettingStartedList', () => {
  it('lists every step as a link that says whether it is done', async () => {
    const steps = GETTING_STARTED_STEPS.map((step) => ({ step, done: step === 'openSong' }));
    renderWithRouter(
      <GettingStartedList progress={{ steps, doneCount: 1, total: 8, isComplete: false }} />
    );

    const list = await screen.findByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(8);
    expect(screen.getByRole('link', { name: /^Open a song \(Done\)/ })).toHaveAttribute(
      'href',
      '/songs'
    );
    expect(
      screen.getByRole('link', { name: /^Join or make a folder \(Not done yet\)/ })
    ).toHaveAttribute('href', '/folders');
  });
});
