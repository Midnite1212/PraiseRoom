import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { SetlistSummary } from './api';
import { SetlistCalendar } from './setlist-calendar';
import { SetlistListContext } from './setlist-list-context';

const noop = () => undefined;
const NOW = new Date(2030, 5, 15, 12).getTime();

const setlist = (_id: string, name: string, day: number): SetlistSummary => ({
  _id,
  urlKey: 'k3x9p2',
  name,
  date: new Date(2030, 5, day).toISOString(),
  groupIds: [],
  songs: [],
});

const SETLISTS = [
  setlist('a', 'Past set', 2),
  setlist('b', 'Next set', 20),
  setlist('c', 'Later', 27),
];

const dayButton = (name: string) => screen.getByRole('button', { name: new RegExp(name) });

describe('SetlistCalendar', () => {
  it('colours each day dot by the status of its setlist', () => {
    render(<SetlistCalendar setlists={SETLISTS} now={NOW} day={undefined} onDayChange={noop} />);
    expect(dayButton('Past set').className).toContain('after:bg-ink/70');
    expect(dayButton('Next set').className).toContain('after:bg-pixel-on');
    expect(dayButton('Later').className).toContain('after:bg-ink/40');
  });

  it('shows the legend, or the picked day with a way back', () => {
    const onDayChange = vi.fn<(day: string | undefined) => void>();
    const { rerender } = render(
      <SetlistCalendar setlists={SETLISTS} now={NOW} day={undefined} onDayChange={onDayChange} />
    );
    expect(screen.getByText('Later')).toBeInTheDocument();
    rerender(
      <SetlistCalendar setlists={SETLISTS} now={NOW} day="2030-06-20" onDayChange={onDayChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }));
    expect(onDayChange).toHaveBeenCalledWith(undefined);
  });

  it('lights the day while it is hovered and lights it when the list does', () => {
    const onLightDay = vi.fn<(day: string | null) => void>();
    render(
      <SetlistListContext
        value={{ litDay: '2030-06-27', onLightDay, selectedId: undefined, onSelect: undefined }}
      >
        <SetlistCalendar setlists={SETLISTS} now={NOW} day={undefined} onDayChange={noop} />
      </SetlistListContext>
    );
    fireEvent.pointerEnter(dayButton('Next set'));
    expect(onLightDay).toHaveBeenCalledWith('2030-06-20');
    fireEvent.pointerLeave(dayButton('Next set'));
    expect(onLightDay).toHaveBeenLastCalledWith(null);
    expect(dayButton('Later')).toHaveClass('liquid-on');
  });
});
