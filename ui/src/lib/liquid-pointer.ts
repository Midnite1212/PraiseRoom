const TARGETS = 'button, a, [role="option"], [role="menuitem"], [tabindex]';

export function liquidOffset(
  point: { x: number; y: number },
  box: { left: number; top: number; width: number; height: number }
): { mx: string; my: string } {
  const across = box.width > 0 ? ((point.x - box.left) / box.width) * 100 : 50;
  const down = box.height > 0 ? ((point.y - box.top) / box.height) * 100 : 0;
  return { mx: `${across.toFixed(1)}%`, my: `${(down * 0.4 - 30).toFixed(1)}%` };
}

// One delegated listener moves the highlight of the liquid fill under a mouse; touch and pen are ignored.
export function syncLiquidPointer(): () => void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let hot: HTMLElement | null = null;
  let frame = 0;
  let last: PointerEvent | null = null;

  const clear = () => {
    hot?.style.removeProperty('--mx');
    hot?.style.removeProperty('--my');
    hot = null;
  };

  const update = () => {
    frame = 0;
    if (!last) return;
    const target =
      last.target instanceof Element ? last.target.closest<HTMLElement>(TARGETS) : null;
    if (hot !== target) clear();
    if (!target) return;
    hot = target;
    const { mx, my } = liquidOffset(
      { x: last.clientX, y: last.clientY },
      target.getBoundingClientRect()
    );
    target.style.setProperty('--mx', mx);
    target.style.setProperty('--my', my);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || reduceMotion.matches) return;
    last = event;
    if (!frame) frame = requestAnimationFrame(update);
  };

  const onLeave = () => {
    last = null;
    clear();
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  return () => {
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    if (frame) cancelAnimationFrame(frame);
    clear();
  };
}
