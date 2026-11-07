import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ChordShape } from '@/features/chords/chord-shapes';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import { ChordChart, ChordShapeCard } from './chord-chart';

const OPEN_G: ChordShape = {
  frets: [3, 2, 0, 0, 0, 3],
  fingers: [2, 1, 0, 0, 0, 3],
  baseFret: 1,
  barres: [],
};
const BARRE_G: ChordShape = {
  frets: [1, 3, 3, 2, 1, 1],
  fingers: [1, 3, 4, 2, 1, 1],
  baseFret: 3,
  barres: [1],
};

const renderCard = (shapes: ChordShape[] | null) =>
  render(
    <ul>
      <ChordShapeCard name="G" shapes={shapes} />
    </ul>
  );

describe('ChordShapeCard', () => {
  it('cycles through the voicings both ways', async () => {
    const user = userEvent.setup();
    renderCard([OPEN_G, BARRE_G]);
    expect(screen.getByTitle('G, frets 3 2 0 0 0 3')).toBeInTheDocument();
    expect(screen.getByText('Shape 1 of 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next shape for G' }));
    expect(screen.getByTitle('G, frets 3 5 5 4 3 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next shape for G' }));
    expect(screen.getByTitle('G, frets 3 2 0 0 0 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous shape for G' }));
    expect(screen.getByText('Shape 2 of 2')).toBeInTheDocument();
  });

  it('has no stepper for a single voicing', () => {
    renderCard([OPEN_G]);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a placeholder for a chord without a shape', () => {
    renderCard([]);
    expect(screen.getByText('No diagram')).toBeInTheDocument();
    expect(screen.queryByTitle(/frets/)).not.toBeInTheDocument();
  });
});

describe('ChordChart', () => {
  it('lists the chords with a Hide button when open', async () => {
    renderWithQueryAndRouter(
      <ChordChart chords={['G', 'D']} open onOpenChange={vi.fn<(open: boolean) => void>()} />
    );
    const toggle = await screen.findByRole('button', { name: 'Hide' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('G')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('collapses to the header with a Show button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    renderWithQueryAndRouter(
      <ChordChart chords={['G', 'D']} open={false} onOpenChange={onOpenChange} />
    );
    expect(await screen.findByRole('heading', { name: 'Chords used' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Show' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('asks to hide from the open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    renderWithQueryAndRouter(<ChordChart chords={['G']} open onOpenChange={onOpenChange} />);
    await user.click(await screen.findByRole('button', { name: 'Hide' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
