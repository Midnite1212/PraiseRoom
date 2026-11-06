import { describe, expect, it } from 'vitest';

import type { Session } from '@/features/auth/session';

import { GETTING_STARTED_STEPS, gettingStartedProgress, homeCardView } from './steps';

const session = (groupIds: { id?: string }[] = []): Session => ({
  id: 'user-1',
  email: 'dummy@example.com',
  fullName: 'Test Member',
  accessType: 'member',
  ownership: {
    _id: 'o1',
    userId: 'user-1',
    fullName: 'Test Member',
    accessType: 'member',
    groupIds,
    setlistIds: [],
  },
});

const doneSteps = (progress: ReturnType<typeof gettingStartedProgress>) =>
  progress.steps.filter(({ done }) => done).map(({ step }) => step);

describe('gettingStartedProgress', () => {
  it('starts with nothing done, in the checklist order', () => {
    const progress = gettingStartedProgress(session(), [], []);
    expect(progress.steps.map(({ step }) => step)).toEqual(GETTING_STARTED_STEPS);
    expect(progress).toMatchObject({ doneCount: 0, total: 8, isComplete: false });
  });

  it('counts a setlist only when you made it', () => {
    expect(doneSteps(gettingStartedProgress(session(), [{ createdBy: 'user-2' }, {}], []))).toEqual(
      []
    );
    expect(doneSteps(gettingStartedProgress(session(), [{ createdBy: 'user-1' }], []))).toEqual([
      'createSetlist',
    ]);
  });

  it('counts a folder once you belong to one', () => {
    expect(doneSteps(gettingStartedProgress(session([{}]), [], []))).toEqual([]);
    expect(doneSteps(gettingStartedProgress(session([{ id: 'f1' }]), [], []))).toEqual([
      'joinFolder',
    ]);
  });

  it('adds the recorded steps and is complete when every step is done', () => {
    const progress = gettingStartedProgress(
      session([{ id: 'f1' }]),
      [{ createdBy: 'user-1' }],
      ['openSong', 'changeKey', 'personalize', 'playHandsFree', 'shareLink', 'capoOrNumbers']
    );
    expect(progress).toMatchObject({ doneCount: 8, total: 8, isComplete: true });
  });
});

describe('homeCardView', () => {
  const open = { dismissed: false, finished: false };

  it('shows the checklist until it is hidden or complete', () => {
    expect(homeCardView({ isComplete: false }, open, false)).toBe('checklist');
    expect(homeCardView({ isComplete: false }, { ...open, dismissed: true }, false)).toBe('hidden');
    expect(homeCardView({ isComplete: true }, open, false)).toBe('hidden');
  });

  it('shows the finished state only while celebrating, then stays hidden', () => {
    expect(homeCardView({ isComplete: true }, open, true)).toBe('finished');
    expect(homeCardView({ isComplete: true }, { ...open, finished: true }, false)).toBe('hidden');
  });
});
