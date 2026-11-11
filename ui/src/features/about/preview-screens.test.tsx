import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n';
import { renderWithRouter } from '@/test/render-with-router';

import { demoSetlists, DEMO_SETLIST_KEY } from './demo-data';
import { seedDemoCache } from './preview-sandbox';
import { PreviewScreenView } from './preview-screens';
import type { PreviewScreen } from './screens';

const NOW = new Date(2026, 10, 9, 10).getTime();

const fetchSpy = vi.fn<typeof fetch>(() => Promise.reject(new Error('previews make no requests')));

const renderScreen = (previewScreen: PreviewScreen) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity, retry: false } },
  });
  seedDemoCache(queryClient, i18n.t, NOW);
  return renderWithRouter(
    <QueryClientProvider client={queryClient}>
      <PreviewScreenView screen={previewScreen} now={NOW} />
    </QueryClientProvider>
  );
};

beforeEach(() => vi.stubGlobal('fetch', fetchSpy));

afterEach(() => {
  localStorage.clear();
  fetchSpy.mockClear();
  vi.unstubAllGlobals();
});

describe('PreviewScreenView', () => {
  it('plays the demo setlist in the real musician view', async () => {
    renderScreen('musician');

    expect(await screen.findByRole('heading', { level: 1, name: 'Amazing Grace' })).toBeVisible();
    await userEvent.keyboard('{ArrowRight}');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Holy, Holy, Holy' })
    ).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('searches the demo library by lyric without asking the server', async () => {
    renderScreen('library');
    const search = await screen.findByRole('searchbox', { name: 'Search songs' });

    await userEvent.type(search, 'river');

    expect(await screen.findByText('It Is Well')).toBeInTheDocument();
    expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('demoSetlists', () => {
  it('dates the demo service on the coming Sunday so it is always next', () => {
    const service = demoSetlists(i18n.t, NOW).find(({ urlKey }) => urlKey === DEMO_SETLIST_KEY);
    const date = new Date(service?.date ?? '');

    expect(date.getDay()).toBe(0);
    expect(date.getTime()).toBeGreaterThan(NOW);
    expect(date.getTime() - NOW).toBeLessThan(7 * 86_400_000);
  });
});
