import type { Session } from '@/features/auth/session';
import type { SetlistSummary } from '@/features/setlists/api';

// Steps that leave no trace on the server, so the place where each happens records it.
export const TRACKED_STEPS = [
  'openSong',
  'changeKey',
  'personalize',
  'playHandsFree',
  'shareLink',
  'capoOrNumbers',
] as const;

export type TrackedStep = (typeof TRACKED_STEPS)[number];

export type GettingStartedStep = TrackedStep | 'createSetlist' | 'joinFolder';

export const GETTING_STARTED_STEPS: readonly GettingStartedStep[] = [
  'openSong',
  'changeKey',
  'personalize',
  'createSetlist',
  'playHandsFree',
  'shareLink',
  'joinFolder',
  'capoOrNumbers',
];

export const isTrackedStep = (value: unknown): value is TrackedStep =>
  TRACKED_STEPS.some((step) => step === value);

export type GettingStartedProgress = {
  steps: { step: GettingStartedStep; done: boolean }[];
  doneCount: number;
  total: number;
  isComplete: boolean;
};

export const gettingStartedProgress = (
  session: Session,
  setlists: readonly Pick<SetlistSummary, 'createdBy'>[],
  marked: readonly TrackedStep[]
): GettingStartedProgress => {
  const done = new Set<GettingStartedStep>(marked);
  if (setlists.some(({ createdBy }) => createdBy === session.id)) done.add('createSetlist');
  if (session.ownership.groupIds.some(({ id }) => Boolean(id))) done.add('joinFolder');
  const steps = GETTING_STARTED_STEPS.map((step) => ({ step, done: done.has(step) }));
  const doneCount = steps.filter((step) => step.done).length;
  return { steps, doneCount, total: steps.length, isComplete: doneCount === steps.length };
};

export type HomeCardView = 'checklist' | 'finished' | 'hidden';

// `celebrating` is true for the one visit on which Home first sees every step done.
export const homeCardView = (
  progress: Pick<GettingStartedProgress, 'isComplete'>,
  stored: { dismissed: boolean; finished: boolean },
  celebrating: boolean
): HomeCardView => {
  if (celebrating) return 'finished';
  if (stored.finished || stored.dismissed || progress.isComplete) return 'hidden';
  return 'checklist';
};
