import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Session } from '@/features/auth/session';
import { requestUrl, sessionResponse } from '@/test/mock-fetch';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import { type SetlistDraft } from './setlist-draft';
import { SetlistEditor } from './setlist-editor';

const SESSION: Session = {
  id: 'u1',
  email: 'a@b.c',
  fullName: 'A',
  accessType: 'member',
  ownership: {
    _id: 'o1',
    userId: 'u1',
    fullName: 'A',
    accessType: 'member',
    groupIds: [],
    setlistIds: [],
  },
};

const DRAFT: SetlistDraft = {
  name: 'Sunday',
  date: '',
  groupIds: [],
  songs: [
    { _id: 'a', title: 'Song a', artist: 'X', originalKey: 'G', tempo: ['Fast'], key: 'G' },
    { _id: 'b', title: 'Song b', artist: 'X', originalKey: 'D', tempo: ['Slow'], key: 'D' },
  ],
};

const updates: unknown[] = [];

const stubApi = (updateStatus = 200) =>
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input, init) => {
      const url = requestUrl(input);
      if (url.includes('get-session')) return Promise.resolve(sessionResponse());
      if (url.includes('/api/setlists/update')) {
        updates.push(typeof init?.body === 'string' ? JSON.parse(init.body) : null);
        return Promise.resolve(
          updateStatus === 200
            ? Response.json({ _id: 's1' })
            : new Response('', { status: updateStatus })
        );
      }
      if (url.includes('/api/songs/search')) {
        return Promise.resolve(
          Response.json({ data: [], totalCount: 0, currentPage: 1, totalPages: 1 })
        );
      }
      return Promise.resolve(Response.json([]));
    })
  );

const renderEditor = (draft: SetlistDraft = DRAFT) =>
  renderWithQueryAndRouter(
    <SetlistEditor session={SESSION} setlistId="s1" initialDraft={draft} now={0} />
  );

afterEach(() => {
  updates.length = 0;
  vi.unstubAllGlobals();
});

describe('SetlistEditor', () => {
  it('opens without saving, then saves the whole draft when Done is pressed', async () => {
    stubApi();
    const user = userEvent.setup();
    renderEditor();
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(updates).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Remove Song b' }));
    await user.click(
      screen.getAllByRole('button', { name: 'Key up a semitone' })[0] ?? document.body
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toMatchObject({
      id: 's1',
      name: 'Sunday',
      songs: ['a'],
      songKeys: [{ songId: 'a', key: 'Ab' }],
      groupIds: [],
    });
  });

  it('undoes the last change', async () => {
    stubApi();
    const user = userEvent.setup();
    renderEditor();
    await user.click(await screen.findByRole('button', { name: 'Remove Song b' }));
    expect(screen.queryByText('Song b')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('Song b')).toBeInTheDocument();
  });

  it('holds the save while the name is empty and Done asks for one', async () => {
    stubApi();
    const user = userEvent.setup();
    renderEditor();
    await user.clear(await screen.findByRole('textbox', { name: 'Name' }));
    expect(screen.getByText('Not saved yet')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(updates).toHaveLength(0);
  });

  it('offers a retry when saving fails', async () => {
    stubApi(500);
    const user = userEvent.setup();
    renderEditor();
    await user.click(await screen.findByRole('button', { name: 'Remove Song b' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
