import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithQueryAndRouter } from '@/test/render-with-router';

import type { Tool } from './tools';
import { ToolsPage } from './tools-page';

const renderTools = (tool: Tool) => {
  const onToolChange = vi.fn<(tool: Tool) => void>();
  renderWithQueryAndRouter(<ToolsPage tool={tool} onToolChange={onToolChange} />);
  return { onToolChange };
};

const cardLabels = (list: HTMLElement) =>
  within(list)
    .getAllByRole('listitem')
    .map((item) =>
      Array.from(item.querySelectorAll(':scope > span'), (label) => label.textContent).join(' ')
    );

describe('ToolsPage', () => {
  it('opens on the chord library and switches tools', async () => {
    const user = userEvent.setup();
    const { onToolChange } = renderTools('chords');

    expect(await screen.findByRole('heading', { name: 'Tools', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Chords' })).toBeChecked();
    expect(screen.getByRole('searchbox', { name: 'Search chords' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Major and minor chords' })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Capo' }));
    expect(onToolChange).toHaveBeenCalledWith('capo');
  });

  it('searches the chord library and draws the shapes', async () => {
    const user = userEvent.setup();
    renderTools('chords');

    await user.type(await screen.findByRole('searchbox', { name: 'Search chords' }), 'G7');
    expect(cardLabels(screen.getByRole('list', { name: 'Chords' })).slice(0, 2)).toEqual([
      'G7',
      'G7sus4',
    ]);
    expect(await screen.findByTitle('G7, frets 3 2 0 0 0 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next shape for G7' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'G' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Bb' }));
    expect(screen.getByRole('searchbox', { name: 'Search chords' })).toHaveValue('Bb');
    expect(cardLabels(screen.getByRole('list', { name: 'Chords' }))[1]).toBe('Bbm');
  });

  it('offers to clear a search that names no chord', async () => {
    const user = userEvent.setup();
    renderTools('chords');

    await user.type(await screen.findByRole('searchbox', { name: 'Search chords' }), 'hello');
    expect(screen.getByText('No chord called “hello”')).toBeInTheDocument();

    await user.click(screen.getByText('Clear search'));
    expect(screen.getByRole('list', { name: 'Major and minor chords' })).toBeInTheDocument();
  });

  it('lists a key’s chords with their numbers and the worship progressions', async () => {
    const user = userEvent.setup();
    renderTools('keys');

    await user.click(await screen.findByRole('button', { name: 'G' }));
    expect(cardLabels(screen.getByRole('list', { name: 'Chords in G' }))).toEqual([
      '1 G',
      '2m Am',
      '3m Bm',
      '4 C',
      '5 D',
      '6m Em',
      '7dim F#dim',
    ]);
    expect(cardLabels(screen.getByRole('list', { name: 'I–V–vi–IV in G' }))).toEqual([
      '1 G',
      '5 D',
      '6m Em',
      '4 C',
    ]);
    expect(screen.getByRole('list', { name: 'I–IV–vi–V in G' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'ii–V–I in G' })).toBeInTheDocument();
  });

  it('finds the capo for a song key and the shapes to play', async () => {
    const user = userEvent.setup();
    renderTools('capo');

    expect(await screen.findByText('Fret 3')).toBeInTheDocument();
    expect(
      screen.getByText('Play G shapes with the capo on fret 3 to sound in Bb.')
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole('group', { name: 'Song key' })).getByRole('button', { name: 'G' })
    );
    expect(screen.getByText('No capo')).toBeInTheDocument();

    await user.click(
      within(screen.getByRole('group', { name: 'Chord shapes' })).getByRole('button', { name: 'A' })
    );
    expect(screen.getByText('Fret 10')).toBeInTheDocument();
    expect(screen.getByText(/high up the neck/)).toBeInTheDocument();
  });

  it('finds the key from the shapes and the capo', async () => {
    const user = userEvent.setup();
    renderTools('capo');

    await user.click(await screen.findByRole('radio', { name: 'Find the key' }));
    expect(screen.getByText('G shapes with the capo on fret 3 sound in Bb.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Capo up' }));
    expect(screen.getByText('G shapes with the capo on fret 4 sound in B.')).toBeInTheDocument();
  });
});
