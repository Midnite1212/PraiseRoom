import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActionMenu, MenuRow } from './action-menu';

const stubWidth = (isWide: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn<(query: string) => object>((query) => ({
      matches: isWide,
      media: query,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    }))
  );

const renderMenu = () =>
  render(
    <ActionMenu
      trigger={<button type="button">Open</button>}
      title="Profile"
      header={<MenuRow>Header row</MenuRow>}
    >
      <MenuRow>Body row</MenuRow>
    </ActionMenu>
  );

describe('ActionMenu', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['a phone', false],
    ['a wide screen', true],
  ])('closes from a row in its header on %s', async (_, isWide) => {
    stubWidth(isWide);
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Header row' }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Body row' })).not.toBeInTheDocument()
    );
  });
});
