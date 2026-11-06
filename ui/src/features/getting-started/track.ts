import { createContext, use } from 'react';

import type { TrackedStep } from './steps';
import { markStepDone } from './store';

// The signed-in user whose steps count; null outside the `/_app` layout, so the public link and
// signed-out pages record nothing.
export const GettingStartedUserContext = createContext<string | null>(null);

export const useMarkStep = () => {
  const userId = use(GettingStartedUserContext);
  return (step: TrackedStep) => {
    if (userId) markStepDone(userId, step);
  };
};
