import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Session } from '@/features/auth/session';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import type { SetlistSummary } from './api';
import { ManagedSetlistRow } from './setlist-row';

const session = (overrides: Partial<Session> = {}): Session => ({
  id: 'user-1',
  email: 'member@example.com',
  fullName: 'Test Member',
  accessType: 'member',
  ownership: {
    _id: '0'.repeat(24),
    userId: 'user-1',
    fullName: 'Test Member',
    accessType: 'member',
    groupIds: [{ id: 'folder-a' }],
    setlistIds: [],
  },
  ...overrides,
});

const setlist = (overrides: Partial<SetlistSummary> = {}): SetlistSummary => ({
  _id: 's1',
  name: 'Sunday set',
  date: null,
  createdBy: 'user-1',
  groupIds: [],
  songs: [],
  ...overrides,
});

const names = {
  folders: new Map<string, string>(),
  people: new Map([['user-2', 'Test Maker']]),
};

const openMenu = async (current: Session, target: SetlistSummary) => {
  renderWithQueryAndRouter(
    <ManagedSetlistRow session={current} setlist={target} names={names} status="undated" />
  );
  fireEvent.click(await screen.findByRole('button', { name: /^Actions for / }));
};

describe('setlist action menu', () => {
  it('offers the creator every action including Delete', async () => {
    await openMenu(session(), setlist());
    expect(await screen.findByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to a folder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete setlist' })).toBeInTheDocument();
    expect(screen.queryByText(/made this/)).not.toBeInTheDocument();
  });

  it('tells a folder member who made it and that they can edit it', async () => {
    await openMenu(session(), setlist({ createdBy: 'user-2', groupIds: ['folder-a'] }));
    expect(await screen.findByText('made this; you can edit it.')).toBeInTheDocument();
    expect(screen.getAllByText('Test Maker')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Add to a folder' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete setlist' })).not.toBeInTheDocument();
  });

  it('gives a viewer who cannot edit only Open, Share, Duplicate and the note', async () => {
    await openMenu(session(), setlist({ createdBy: 'user-2' }));
    expect(await screen.findByText('made this.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add to a folder' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete setlist' })).not.toBeInTheDocument();
  });
});
