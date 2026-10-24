import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Tray } from './tray';

const stubPhone = () =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn<(query: string) => object>((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    }))
  );

const renderTray = () =>
  render(
    <>
      <button type="button">Outside</button>
      <Tray trigger={<button type="button">Open</button>} title="Reading">
        <button type="button">Inside</button>
      </Tray>
    </>
  );

describe('Tray on a phone', () => {
  beforeEach(() => {
    stubPhone();
    Element.prototype.setPointerCapture = vi.fn<() => void>();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('opens a non-modal dialog that leaves the page undimmed and interactive', async () => {
    const user = userEvent.setup();
    renderTray();
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog', { name: 'Reading' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Outside' })).toBeVisible();
  });

  it('shows a head with a close button when it has a description', async () => {
    const user = userEvent.setup();
    render(
      <Tray trigger={<button type="button">Open</button>} title="Settings" description="Saved here">
        <p>Body</p>
      </Tray>
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Saved here')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape and on a tap outside', async () => {
    const user = userEvent.setup();
    renderTray();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when dragged down past 56px, and stays for a short drag', async () => {
    const user = userEvent.setup();
    renderTray();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const tray = screen.getByRole('dialog', { name: 'Reading' });

    fireEvent.pointerDown(tray, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(tray, { clientY: 130, pointerId: 1 });
    fireEvent.pointerUp(tray, { clientY: 130, pointerId: 1 });
    expect(screen.getByRole('dialog', { name: 'Reading' })).toBeInTheDocument();

    fireEvent.pointerDown(tray, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(tray, { clientY: 170, pointerId: 1 });
    fireEvent.pointerUp(tray, { clientY: 170, pointerId: 1 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not start a drag from a button', async () => {
    const user = userEvent.setup();
    renderTray();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const inside = screen.getByRole('button', { name: 'Inside' });

    fireEvent.pointerDown(inside, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(inside, { clientY: 200, pointerId: 1 });
    fireEvent.pointerUp(inside, { clientY: 200, pointerId: 1 });
    expect(screen.getByRole('dialog', { name: 'Reading' })).toBeInTheDocument();
  });
});
