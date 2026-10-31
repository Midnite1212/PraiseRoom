import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSongSwipe } from './use-song-swipe';

type Finger = { clientX: number; clientY: number };

const fire = (target: Element, type: string, touches: Finger[], changed: Finger[] = touches) => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'touches', { value: touches });
  Object.defineProperty(event, 'changedTouches', { value: changed });
  target.dispatchEvent(event);
};

const finger = (clientX: number, clientY: number): Finger => ({ clientX, clientY });

const swipe = (target: Element, from: Finger, to: Finger) => {
  fire(target, 'touchstart', [from]);
  fire(target, 'touchmove', [to]);
  fire(target, 'touchend', [], [to]);
};

function Harness({ onSwipe }: { onSwipe: (direction: 1 | -1) => void }) {
  useSongSwipe(onSwipe);
  return (
    <main>
      <p>Lyrics</p>
      <input aria-label="Note" />
      <div role="menu" aria-label="Panel">
        Panel
      </div>
    </main>
  );
}

const setup = () => {
  const onSwipe = vi.fn<(direction: 1 | -1) => void>();
  const view = render(<Harness onSwipe={onSwipe} />);
  return { onSwipe, lyrics: view.getByText('Lyrics'), input: view.getByLabelText('Note') };
};

describe('useSongSwipe', () => {
  afterEach(() => vi.restoreAllMocks());

  it('moves to the next song on a swipe left and the previous on a swipe right', () => {
    const { onSwipe, lyrics } = setup();
    swipe(lyrics, finger(250, 300), finger(100, 310));
    swipe(lyrics, finger(100, 300), finger(250, 290));
    expect(onSwipe.mock.calls).toEqual([[1], [-1]]);
  });

  it('ignores vertical scrolling', () => {
    const { onSwipe, lyrics } = setup();
    swipe(lyrics, finger(200, 600), finger(190, 200));
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('ignores swipes that start in an input or a menu', () => {
    const { onSwipe, input } = setup();
    swipe(input, finger(250, 300), finger(100, 300));
    const menu = document.querySelector('[role="menu"]');
    if (menu) swipe(menu, finger(250, 300), finger(100, 300));
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('ignores a swipe that begins in a sideways-scrolling strip', () => {
    const { onSwipe, lyrics } = setup();
    const strip = document.createElement('div');
    strip.style.overflowX = 'auto';
    Object.defineProperty(strip, 'scrollWidth', { value: 600 });
    Object.defineProperty(strip, 'clientWidth', { value: 300 });
    lyrics.append(strip);
    swipe(strip, finger(250, 300), finger(100, 300));
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('ignores a pinch', () => {
    const { onSwipe, lyrics } = setup();
    fire(lyrics, 'touchstart', [finger(250, 300), finger(300, 300)]);
    fire(lyrics, 'touchend', [], [finger(100, 300)]);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('ignores a swipe while the page is pinch-zoomed in', () => {
    vi.stubGlobal('visualViewport', { scale: 2 });
    const { onSwipe, lyrics } = setup();
    swipe(lyrics, finger(250, 300), finger(100, 300));
    vi.unstubAllGlobals();
    expect(onSwipe).not.toHaveBeenCalled();
  });
});
