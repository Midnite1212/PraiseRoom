import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { renderWithQueryAndRouter } from '@/test/render-with-router';

import { Metronome } from './metronome';
import type { Tool } from './tools';
import { ToolsPage } from './tools-page';

type Click = { pitch: number; start: number; stop: number };

const beatCells = () =>
  within(screen.getByRole('list', { name: 'Beats' })).getAllByRole('listitem');

const litBeat = () =>
  beatCells().findIndex((cell) => cell.getAttribute('aria-current') === 'true') + 1;

const rounded = (value: number) => Number(value.toFixed(4));

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
};

const startPlaying = async () => {
  const user = userEvent.setup();
  const view = render(<Metronome />);
  await user.click(screen.getByRole('button', { name: 'Start' }));
  return { user, view };
};

function SwitchableTools() {
  const [tool, setTool] = useState<Tool>('metronome');
  return <ToolsPage tool={tool} onToolChange={setTool} />;
}

describe('Metronome', () => {
  let contexts: {
    currentTime: number;
    resume: Mock<() => Promise<void>>;
    close: Mock<() => Promise<void>>;
  }[];
  let clicks: Click[];
  let timers: Map<number, () => void>;
  let frames: FrameRequestCallback[];
  let clearTimer: Mock<(handle: number) => void>;
  let cancelFrame: Mock<(handle: number) => void>;

  const context = () => {
    const current = contexts[0];
    if (!current) throw new Error('No audio context was made');
    return current;
  };

  const runTimers = () => {
    for (const timer of timers.values()) timer();
  };

  const runFrames = () => {
    const due = frames.splice(0);
    act(() => {
      for (const frame of due) frame(0);
    });
  };

  const advanceTo = (seconds: number) => {
    context().currentTime = seconds;
    runTimers();
    runFrames();
  };

  beforeEach(() => {
    contexts = [];
    clicks = [];
    timers = new Map();
    frames = [];
    clearTimer = vi.fn<(handle: number) => void>((handle) => {
      timers.delete(handle);
    });
    cancelFrame = vi.fn<(handle: number) => void>();

    class FakeAudioContext {
      currentTime = 0;
      destination = {};
      resume = vi.fn<() => Promise<void>>(() => Promise.resolve());
      close = vi.fn<() => Promise<void>>(() => Promise.resolve());

      constructor() {
        contexts.push(this);
      }

      createOscillator() {
        const click: Click = { pitch: 0, start: Number.NaN, stop: Number.NaN };
        clicks.push(click);
        return {
          frequency: {
            setValueAtTime: (value: number) => {
              click.pitch = value;
            },
          },
          connect: <T,>(node: T) => node,
          start: (time: number) => {
            click.start = time;
          },
          stop: (time: number) => {
            click.stop = time;
          },
        };
      }

      createGain() {
        return {
          gain: { setValueAtTime: () => undefined, exponentialRampToValueAtTime: () => undefined },
          connect: <T,>(node: T) => node,
        };
      }
    }

    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('setInterval', (callback: () => void) => {
      const handle = timers.size + 1;
      timers.set(handle, callback);
      return handle;
    });
    vi.stubGlobal('clearInterval', clearTimer);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback)
    );
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
    setVisibility('visible');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('waits for Start before making any sound', () => {
    render(<Metronome />);

    expect(screen.getByText('72')).toBeInTheDocument();
    expect(beatCells().map((cell) => cell.textContent)).toEqual([
      '1Beat 1, accented',
      '2Beat 2',
      '3Beat 3',
      '4Beat 4',
    ]);
    expect(litBeat()).toBe(0);
    expect(contexts).toHaveLength(0);
  });

  it('starts the audio clock inside the Start press and schedules the first click ahead', async () => {
    await startPlaying();

    expect(contexts).toHaveLength(1);
    expect(context().resume).toHaveBeenCalledTimes(1);
    expect(clicks.map(({ pitch, start, stop }) => [pitch, rounded(start), rounded(stop)])).toEqual([
      [1760, 0.06, 0.11],
    ]);
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
  });

  it('schedules each click on the audio clock, not when the timer runs', async () => {
    await startPlaying();

    advanceTo(0.5);
    expect(clicks).toHaveLength(1);

    advanceTo(0.81);
    advanceTo(0.95);
    advanceTo(1.7);
    advanceTo(2.47);

    expect(clicks.map(({ start }) => rounded(start))).toEqual([0.06, 0.8933, 1.7267, 2.56]);
    expect(clicks.map(({ pitch }) => pitch)).toEqual([1760, 880, 880, 880]);
  });

  it('lights each beat when the audio clock reaches it and accents the downbeat', async () => {
    await startPlaying();

    advanceTo(0.03);
    expect(litBeat()).toBe(0);

    advanceTo(0.07);
    expect(litBeat()).toBe(1);

    advanceTo(0.81);
    advanceTo(0.9);
    expect(litBeat()).toBe(2);

    for (const time of [1.65, 1.75, 2.5, 2.6, 3.35, 3.4]) advanceTo(time);
    expect(litBeat()).toBe(1);
    expect(clicks.at(-1)?.pitch).toBe(1760);
  });

  it('accents beat four lightly in 6/8', async () => {
    const { user } = await startPlaying();

    await user.click(screen.getByRole('radio', { name: '6/8' }));
    expect(screen.getByText('Six clicks a bar, accents on 1 and 4')).toBeInTheDocument();
    expect(beatCells()).toHaveLength(6);

    for (let step = 1; step <= 7; step += 1) advanceTo(step * 0.84);
    expect(clicks.map(({ pitch }) => pitch)).toEqual([1760, 1760, 880, 880, 1320, 880, 880, 1760]);
  });

  it('changes the tempo with the field, the buttons and the slider', async () => {
    const user = userEvent.setup();
    render(<Metronome />);
    const field = screen.getByRole('textbox', { name: 'Beats per minute' });

    await user.clear(field);
    await user.type(field, '120');
    expect(screen.getByText('120')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Faster' }));
    expect(field).toHaveValue('121');

    await user.clear(field);
    await user.type(field, '999{Enter}');
    expect(field).toHaveValue('240');
    expect(screen.getByRole('button', { name: 'Faster' })).toBeDisabled();

    fireEvent.change(screen.getByRole('slider', { name: 'Tempo' }), { target: { value: '30' } });
    expect(field).toHaveValue('30');
    expect(screen.getByRole('button', { name: 'Slower' })).toBeDisabled();

    await user.clear(field);
    await user.tab();
    expect(field).toHaveValue('30');
  });

  it('sets the tempo from taps and moves the clicks to it', async () => {
    const { user } = await startPlaying();
    const now = vi.spyOn(performance, 'now');
    const tap = screen.getByRole('button', { name: 'Tap tempo' });

    now.mockReturnValue(1000);
    await user.click(tap);
    now.mockReturnValue(1500);
    await user.click(tap);
    now.mockReturnValue(2000);
    await user.click(tap);
    expect(screen.getByRole('textbox', { name: 'Beats per minute' })).toHaveValue('120');

    advanceTo(0.81);
    advanceTo(1.3);
    expect(clicks.map(({ start }) => rounded(start))).toEqual([0.06, 0.8933, 1.3933]);

    now.mockReturnValue(9000);
    await user.click(tap);
    expect(screen.getByRole('textbox', { name: 'Beats per minute' })).toHaveValue('120');
  });

  it('stops the clicks and closes the audio clock on Stop', async () => {
    const { user } = await startPlaying();
    advanceTo(0.07);

    await user.click(screen.getByRole('button', { name: 'Stop' }));

    expect(context().close).toHaveBeenCalledTimes(1);
    expect(clearTimer).toHaveBeenCalledTimes(1);
    expect(cancelFrame).toHaveBeenCalled();
    expect(timers.size).toBe(0);
    expect(litBeat()).toBe(0);
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(contexts).toHaveLength(2);
  });

  it('closes the audio clock when it leaves the screen', async () => {
    const { view } = await startPlaying();

    view.unmount();

    expect(context().close).toHaveBeenCalledTimes(1);
    expect(timers.size).toBe(0);
  });

  it('stops when the tab is hidden', async () => {
    await startPlaying();

    act(() => setVisibility('hidden'));

    expect(context().close).toHaveBeenCalledTimes(1);
    expect(timers.size).toBe(0);
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
  });

  it('stops when the musician switches to another tool', async () => {
    const user = userEvent.setup();
    renderWithQueryAndRouter(<SwitchableTools />);

    await user.click(await screen.findByRole('button', { name: 'Start' }));
    expect(contexts).toHaveLength(1);

    await user.click(screen.getByRole('radio', { name: 'Chords' }));

    expect(await screen.findByRole('searchbox', { name: 'Search chords' })).toBeInTheDocument();
    expect(context().close).toHaveBeenCalledTimes(1);
    expect(timers.size).toBe(0);
  });

  it('says so when the browser cannot make sound', () => {
    vi.stubGlobal('AudioContext', undefined);
    render(<Metronome />);

    expect(screen.getByRole('alert')).toHaveTextContent('This browser cannot play the clicks');
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
  });
});
