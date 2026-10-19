import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/test/render-with-router';

import { SongSearchForm } from './song-search-form';

describe('SongSearchForm', () => {
  it('hides the web search switch for a member', async () => {
    renderWithRouter(
      <SongSearchForm
        keyword=""
        onSearch={vi.fn<(keyword: string) => void>()}
        canSearchWeb={false}
        web={false}
        onWebChange={vi.fn<(web: boolean) => void>()}
      />
    );

    await screen.findByRole('searchbox');
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('shows the web search switch for a writer and reports changes', async () => {
    const user = userEvent.setup();
    const onWebChange = vi.fn<(web: boolean) => void>();
    renderWithRouter(
      <SongSearchForm
        keyword=""
        onSearch={vi.fn<(keyword: string) => void>()}
        canSearchWeb
        web={false}
        onWebChange={onWebChange}
      />
    );

    const toggle = await screen.findByRole('switch', { name: 'Search the web too' });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);

    expect(onWebChange).toHaveBeenCalledWith(true);
  });

  it('drops the query string from a pasted chord-site link before searching', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn<(keyword: string) => void>();
    renderWithRouter(
      <SongSearchForm
        keyword=""
        onSearch={onSearch}
        canSearchWeb
        web
        onWebChange={vi.fn<(web: boolean) => void>()}
      />
    );

    await user.type(
      await screen.findByRole('searchbox'),
      'https://tabs.ultimate-guitar.com/tab/invented-band/invented-song-chords-1234567?capo=0&transpose=0{Enter}'
    );

    expect(onSearch).toHaveBeenCalledWith(
      'https://tabs.ultimate-guitar.com/tab/invented-band/invented-song-chords-1234567'
    );
  });

  it('shows an error instead of silently ignoring a search that is too long', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn<(keyword: string) => void>();
    renderWithRouter(
      <SongSearchForm
        keyword=""
        onSearch={onSearch}
        canSearchWeb={false}
        web={false}
        onWebChange={vi.fn<(web: boolean) => void>()}
      />
    );

    await user.type(await screen.findByRole('searchbox'), `${'a'.repeat(101)}{Enter}`);

    expect(await screen.findByText('Keep the search under 100 characters.')).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });
});
