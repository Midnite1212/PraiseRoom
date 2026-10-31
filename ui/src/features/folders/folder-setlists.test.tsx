import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Session } from '@/features/auth/session';
import type { Folder } from '@/features/setlists/api';
import { requestUrl, sessionResponse } from '@/test/mock-fetch';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import { AddSetlistsDialog } from './folder-setlists';

const FOLDER_ID = 'a'.repeat(24);

const folder: Folder = {
  _id: FOLDER_ID,
  urlKey: 'k3x9p2',
  groupName: 'Team',
  setlistIds: [],
  createdBy: 'someone',
};

const session = (groupIds: string[]): Session => ({
  id: 'user-1',
  email: 'member@example.com',
  fullName: 'Test Member',
  accessType: 'member',
  ownership: {
    _id: '0'.repeat(24),
    userId: 'user-1',
    fullName: 'Test Member',
    accessType: 'member',
    groupIds: groupIds.map((id) => ({ id })),
    setlistIds: [],
  },
});

const renderDialog = (current: Session) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) =>
      Promise.resolve(
        requestUrl(input).includes('get-session')
          ? sessionResponse()
          : new Response(JSON.stringify([]), { headers: { 'content-type': 'application/json' } })
      )
    )
  );
  return renderWithQueryAndRouter(
    <AddSetlistsDialog session={current} folder={folder} now={0} open onOpenChange={() => {}} />
  );
};

describe('AddSetlistsDialog create action', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('links to a new setlist with the folder preselected for someone who can edit the folder', async () => {
    const { findByRole } = renderDialog(session([FOLDER_ID]));
    const link = await findByRole('link', { name: 'Create a new setlist' });
    expect(link).toHaveAttribute('href', `/setlists/new?folder=${FOLDER_ID}`);
  });

  it('is hidden from someone who cannot edit the folder', async () => {
    const { findByText, queryByRole } = renderDialog(session([]));
    await findByText('Add setlists');
    expect(queryByRole('link', { name: 'Create a new setlist' })).not.toBeInTheDocument();
  });
});
