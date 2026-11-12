import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/test/render-with-router';

import { AboutPage } from './about-page';

afterEach(() => localStorage.clear());

describe('AboutPage', () => {
  it('renders the hero, every section and the device previews without a session', async () => {
    renderWithRouter(<AboutPage />);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Your songs are everywhere. Now they live in one room.',
      })
    ).toBeInTheDocument();
    for (const name of [
      'Seven doors off the same room.',
      'Play the set yourself.',
      'How to, step by step.',
      'Tell us what to fix next.',
      'Built by a worship team, for worship teams.',
      'Questions people ask.',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getByTitle('Song library · Desktop')).toHaveAttribute(
      'src',
      '/about/preview/library'
    );
    expect(screen.getByTitle('Full demo · Desktop')).toHaveAttribute('src', '/about/preview/demo');
  });

  it('switches the feature preview to another screen size', async () => {
    renderWithRouter(<AboutPage />);
    const switcher = (await screen.findAllByRole('radiogroup', { name: 'Screen' }))[0];
    if (!switcher) throw new Error('missing screen switcher');

    await userEvent.click(within(switcher).getByRole('radio', { name: /Phone/ }));

    expect(screen.getByTitle('Song library · Phone')).toBeInTheDocument();
  });

  it('asks for a message before thanking the sender', async () => {
    renderWithRouter(<AboutPage />);
    const send = await screen.findByRole('button', { name: 'Send feedback' });

    await userEvent.click(send);
    expect(await screen.findByText('Write a few words about it.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Message'), 'The bridge chord in It Is Well');
    await userEvent.click(send);
    expect(await screen.findByText("Thank you. It's in the room.")).toBeInTheDocument();
  });
});
