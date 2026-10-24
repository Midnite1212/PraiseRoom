import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MiniCalendar } from './mini-calendar';

const noop = () => undefined;

describe('MiniCalendar', () => {
  it('opens on the picked month and marks the picked day', () => {
    render(<MiniCalendar value="2030-02-14" today="2030-06-15" onChange={noop} />);
    expect(screen.getByText('February 2030')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /February 14/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
  });

  it('opens on the month of today when no day is picked, and steps between months', async () => {
    const user = userEvent.setup();
    render(<MiniCalendar value="" today="2030-12-31" onChange={noop} />);
    expect(screen.getByText('December 2030')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('January 2031')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('November 2030')).toBeInTheDocument();
  });

  it('reports the picked day as YYYY-MM-DD', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(day: string) => void>();
    render(<MiniCalendar value="" today="2030-03-05" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /March 9/ }));
    expect(onChange).toHaveBeenCalledWith('2030-03-09');
  });
});
