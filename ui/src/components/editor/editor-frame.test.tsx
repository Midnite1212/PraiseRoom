import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EditorChip } from './editor-chips';
import { EditorFrame } from './editor-frame';

const renderFrame = (props: Partial<Parameters<typeof EditorFrame>[0]> = {}) => {
  const onUndo = vi.fn<() => void>();
  const onDone = vi.fn<() => void>();
  const view = render(
    <EditorFrame
      heading="Edit thing"
      back={<a href="/songs">Songs</a>}
      names={<input aria-label="Title" defaultValue="Draft" />}
      status="saved"
      canUndo
      onUndo={onUndo}
      onDone={onDone}
      chips={
        <EditorChip label="Key" value="G">
          Pick a key
        </EditorChip>
      }
      {...props}
    >
      <p>Body</p>
    </EditorFrame>
  );
  return { ...view, onUndo, onDone };
};

describe('EditorFrame', () => {
  it('shows the save status and calls Done', async () => {
    const user = userEvent.setup();
    const { onDone, rerender } = renderFrame({ status: 'saving' });
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onDone).toHaveBeenCalledTimes(1);

    rerender(
      <EditorFrame
        heading="Edit thing"
        back={<a href="/songs">Songs</a>}
        names={<input aria-label="Title" />}
        status="saved"
        canUndo={false}
        onUndo={() => undefined}
        onDone={() => undefined}
      >
        <p>Body</p>
      </EditorFrame>
    );
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('offers a retry when saving failed', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn<() => void>();
    renderFrame({ status: 'error', onRetry });
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables Undo when there is nothing to undo and undoes with the button and Ctrl+Z outside inputs', async () => {
    const user = userEvent.setup();
    const { onUndo, unmount } = renderFrame();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await user.keyboard('{Control>}z{/Control}');
    expect(onUndo).toHaveBeenCalledTimes(2);

    screen.getByRole('textbox', { name: 'Title' }).focus();
    await user.keyboard('{Control>}z{/Control}');
    expect(onUndo).toHaveBeenCalledTimes(2);
    unmount();

    renderFrame({ canUndo: false });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('marks the page as editing while open', () => {
    const { unmount } = renderFrame();
    expect(document.documentElement).toHaveClass('editing');
    unmount();
    expect(document.documentElement).not.toHaveClass('editing');
  });

  it('opens a chip into a popover', async () => {
    const user = userEvent.setup();
    renderFrame();
    await user.click(screen.getByRole('button', { name: /Key/ }));
    expect(await screen.findByText('Pick a key')).toBeInTheDocument();
  });
});
