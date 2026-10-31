export type Point = { x: number; y: number };

export const SWIPE_MIN_DISTANCE = 64;
const SWIPE_MIN_RATIO = 2;

// A swipe left asks for the next song (1) and a swipe right for the previous (-1). Short or diagonal drags
// give 0, so scrolling and slow drifts never change the song.
export const swipeDirection = (start: Point, end: Point): -1 | 0 | 1 => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return 0;
  if (Math.abs(dx) < Math.abs(dy) * SWIPE_MIN_RATIO) return 0;
  return dx < 0 ? 1 : -1;
};
