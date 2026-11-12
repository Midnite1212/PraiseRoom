import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { Tuner } from './tuner';

const SAMPLE_RATE = 48_000;
const SILENCE = new Float32Array(4096);

type FakeTrack = EventTarget & { stop: Mock<() => void> };
type FakeStream = { getTracks: () => FakeTrack[] };

const sine = (frequency: number): Float32Array =>
  Float32Array.from(
    { length: 4096 },
    (_, index) => 0.2 * Math.sin((2 * Math.PI * frequency * index) / SAMPLE_RATE)
  );

const makeStream = () => {
  const track: FakeTrack = Object.assign(new EventTarget(), { stop: vi.fn<() => void>() });
  const stream: FakeStream = { getTracks: () => [track] };
  return { stream, track };
};

const deferred = <T,>() => {
  const handle: { resolve?: (value: T) => void } = {};
  const promise = new Promise<T>((resolve) => {
    handle.resolve = resolve;
  });
  return { promise, resolve: (value: T) => handle.resolve?.(value) };
};

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('Tuner', () => {
  let heard: Float32Array;
  let frames: FrameRequestCallback[];
  let clock: number;
  let analyses: number;
  let contexts: { close: Mock<() => Promise<void>>; resume: Mock<() => Promise<void>> }[];
  let getUserMedia: Mock<(constraints: MediaStreamConstraints) => Promise<FakeStream>>;
  let cancelFrame: Mock<(handle: number) => void>;

  const nextFrame = (elapsed = 40) => {
    clock += elapsed;
    const due = frames.splice(0);
    act(() => {
      for (const frame of due) frame(clock);
    });
  };

  const hear = (signal: Float32Array, analysesToRun = 1) => {
    heard = signal;
    for (let run = 0; run < analysesToRun; run += 1) nextFrame();
  };

  const startListening = async () => {
    const user = userEvent.setup();
    const { stream, track } = makeStream();
    getUserMedia.mockResolvedValue(stream);
    const view = render(<Tuner />);
    await user.click(screen.getByRole('button', { name: 'Start tuner' }));
    await screen.findByText('Play one string and let it ring.');
    return { user, track, view };
  };

  beforeEach(() => {
    heard = SILENCE;
    frames = [];
    clock = 0;
    analyses = 0;
    contexts = [];
    getUserMedia = vi.fn<(constraints: MediaStreamConstraints) => Promise<FakeStream>>();
    cancelFrame = vi.fn<(handle: number) => void>();

    class FakeAudioContext {
      sampleRate = SAMPLE_RATE;
      resume = vi.fn<() => Promise<void>>(() => Promise.resolve());
      close = vi.fn<() => Promise<void>>(() => Promise.resolve());

      constructor() {
        contexts.push(this);
      }

      createAnalyser() {
        return {
          fftSize: 2048,
          getFloatTimeDomainData: (target: Float32Array) => {
            analyses += 1;
            target.set(heard.subarray(0, target.length));
          },
        };
      }

      createMediaStreamSource() {
        return { connect: () => undefined };
      }
    }

    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback)
    );
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    setVisibility('visible');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'mediaDevices');
  });

  it('waits for Start before touching the microphone', () => {
    render(<Tuner />);

    expect(screen.getByText('Tune your guitar')).toBeInTheDocument();
    expect(
      screen.getByText('Audio stays on this device. Nothing is recorded or sent.')
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Strings' }))
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label'))
    ).toEqual([
      'String 6, E2',
      'String 5, A2',
      'String 4, D3',
      'String 3, G3',
      'String 2, B3',
      'String 1, E4',
    ]);
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(contexts).toHaveLength(0);
  });

  it('asks for raw audio and an audio context inside the Start press', async () => {
    const user = userEvent.setup();
    getUserMedia.mockReturnValue(deferred<FakeStream>().promise);
    render(<Tuner />);

    await user.click(screen.getByRole('button', { name: 'Start tuner' }));

    expect(screen.getByRole('status')).toHaveTextContent('Waiting for the microphone');
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    expect(contexts).toHaveLength(1);
    expect(contexts[0]?.resume).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Start tuner' })).not.toBeInTheDocument();
  });

  it('listens without a reading until it hears a note', async () => {
    await startListening();

    hear(SILENCE, 3);

    expect(screen.getByText('Play one string and let it ring.')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
  });

  it('shows the string, the cents and the flat state of a detuned note', async () => {
    await startListening();

    hear(sine(108));

    expect(screen.getByRole('meter', { name: 'Tuning' })).toHaveAttribute('value', '-32');
    expect(screen.getByRole('meter')).toHaveAttribute(
      'aria-valuetext',
      'A2, −32 cents, Flat, tune up'
    );
    expect(screen.getByText('Flat, tune up')).toBeInTheDocument();
    expect(screen.getByText('−32 cents')).toBeInTheDocument();
    expect(screen.getByText('String 5')).toBeInTheDocument();
    expect(screen.getByText('A2 · 108.0 Hz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'String 5, A2' })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('reads in tune and sharp as the string is tuned', async () => {
    await startListening();

    hear(sine(110), 2);
    expect(screen.getByText('In tune')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('value', '0');

    hear(sine(112), 20);
    expect(screen.getByText('Sharp, tune down')).toBeInTheDocument();
    expect(screen.getByText('+31 cents')).toBeInTheDocument();
  });

  it('analyses at most once every 30 ms', async () => {
    await startListening();

    nextFrame(40);
    nextFrame(10);
    nextFrame(10);
    expect(analyses).toBe(1);

    nextFrame(10);
    expect(analyses).toBe(2);
  });

  it('reads against a locked string until it is tapped again', async () => {
    const { user } = await startListening();
    const lowE = screen.getByRole('button', { name: 'String 6, E2' });

    await user.click(lowE);
    hear(sine(108));

    expect(lowE).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('String 6')).toBeInTheDocument();
    expect(screen.getByText('+468 cents')).toBeInTheDocument();
    expect(screen.getByText('Sharp, tune down')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('value', '50');

    await user.click(lowE);

    expect(lowE).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('String 5')).toBeInTheDocument();
    expect(screen.getByText('−32 cents')).toBeInTheDocument();
  });

  it('explains how to allow a blocked microphone and lets the musician retry', async () => {
    const user = userEvent.setup();
    getUserMedia.mockRejectedValueOnce(new DOMException('Permission denied', 'NotAllowedError'));
    render(<Tuner />);

    await user.click(screen.getByRole('button', { name: 'Start tuner' }));

    expect(await screen.findByText('Microphone access is blocked')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('set Microphone to Allow');
    expect(contexts[0]?.close).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('group', { name: 'Strings' })).not.toBeInTheDocument();

    getUserMedia.mockResolvedValue(makeStream().stream);
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Play one string and let it ring.')).toBeInTheDocument();
  });

  it('says so when there is no microphone', async () => {
    const user = userEvent.setup();
    getUserMedia.mockRejectedValue(new DOMException('No device', 'NotFoundError'));
    render(<Tuner />);

    await user.click(screen.getByRole('button', { name: 'Start tuner' }));

    expect(await screen.findByText('No microphone to use')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(contexts[0]?.close).toHaveBeenCalledTimes(1);
  });

  it('says so when the browser cannot share a microphone', () => {
    Reflect.deleteProperty(navigator, 'mediaDevices');
    render(<Tuner />);

    expect(screen.getByText('No microphone to use')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start tuner' })).not.toBeInTheDocument();
  });

  it('asks for HTTPS on an insecure page', () => {
    vi.stubGlobal('isSecureContext', false);
    render(<Tuner />);

    expect(screen.getByText('The microphone needs a secure page')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('HTTPS or on localhost');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('releases the microphone on Stop', async () => {
    const { user, track } = await startListening();
    hear(sine(110));

    await user.click(screen.getByRole('button', { name: 'Stop' }));

    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(contexts[0]?.close).toHaveBeenCalledTimes(1);
    expect(cancelFrame).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Start tuner' })).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('releases the microphone when the tuner leaves the screen', async () => {
    const { track, view } = await startListening();

    view.unmount();

    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(contexts[0]?.close).toHaveBeenCalledTimes(1);
  });

  it('releases the microphone when the tab is hidden', async () => {
    const { track } = await startListening();

    act(() => setVisibility('hidden'));

    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(contexts[0]?.close).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Start tuner' })).toBeInTheDocument();
  });

  it('releases a microphone that is granted after the musician gave up waiting', async () => {
    const user = userEvent.setup();
    const permission = deferred<FakeStream>();
    const { stream, track } = makeStream();
    getUserMedia.mockReturnValue(permission.promise);
    render(<Tuner />);

    await user.click(screen.getByRole('button', { name: 'Start tuner' }));
    await user.click(screen.getByRole('button', { name: 'Stop' }));
    await act(async () => {
      permission.resolve(stream);
      await permission.promise;
    });

    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(contexts[0]?.close).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Start tuner' })).toBeInTheDocument();
  });

  it('gives up when the microphone goes away mid-session', async () => {
    const { track } = await startListening();

    act(() => {
      track.dispatchEvent(new Event('ended'));
    });

    expect(screen.getByText('No microphone to use')).toBeInTheDocument();
    expect(contexts[0]?.close).toHaveBeenCalledTimes(1);
  });
});
