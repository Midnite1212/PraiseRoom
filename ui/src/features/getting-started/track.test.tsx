import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { readGettingStarted } from './store';
import { GettingStartedUserContext, useMarkStep } from './track';

const SignedIn = ({ children }: { children: ReactNode }) => (
  <GettingStartedUserContext value="user-1">{children}</GettingStartedUserContext>
);

afterEach(() => localStorage.clear());

describe('useMarkStep', () => {
  it('records the step for the signed-in user', () => {
    const { result } = renderHook(() => useMarkStep(), { wrapper: SignedIn });
    result.current('shareLink');
    expect(readGettingStarted('user-1').done).toEqual(['shareLink']);
  });

  it('records nothing outside the signed-in app', () => {
    const { result } = renderHook(() => useMarkStep());
    result.current('shareLink');
    expect(localStorage.getItem('getting-started')).toBeNull();
  });
});
