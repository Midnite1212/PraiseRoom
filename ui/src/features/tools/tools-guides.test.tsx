import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/test/render-with-router';

import { ToolsGuides } from './tools-guides';

const summary = (title: string) => {
  const found = screen.getByText(title).closest('summary');
  if (!found) throw new Error(`No guide called ${title}`);
  return found;
};

describe('ToolsGuides', () => {
  it('opens a short read on Nashville numbers', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolsGuides />);

    expect(await screen.findByRole('heading', { name: 'The basics' })).toBeInTheDocument();
    const reads = ['Nashville numbers', 'Using a capo', 'Reading the chord chart'];
    for (const title of reads) expect(summary(title)).toBeInTheDocument();

    const keysLine = screen.getByText(/the numbers do not/);
    expect(keysLine).not.toBeVisible();

    await user.click(summary('Nashville numbers'));

    expect(keysLine).toBeVisible();
    expect(keysLine).toHaveTextContent('still 1–4–5');
    expect(screen.getByText('5/7')).toHaveProperty('tagName', 'STRONG');
  });

  it('links the capo read to the Capo helper', async () => {
    renderWithRouter(<ToolsGuides />);

    expect(await screen.findByRole('link', { name: 'Open the Capo helper' })).toHaveAttribute(
      'href',
      '/tools?tool=capo'
    );
  });

  it('reuses the Praise Room how-tos from the About page', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolsGuides />);

    expect(await screen.findByRole('heading', { name: 'Praise Room how-tos' })).toBeInTheDocument();
    for (const title of [
      'Find a song',
      'Change key while reading',
      'Create a setlist',
      'Play through a set',
      'Send a public link',
    ])
      expect(summary(title)).toBeInTheDocument();

    await user.click(summary('Send a public link'));

    expect(screen.getByText('Public links carry songs only, never member data.')).toBeVisible();
  });
});
