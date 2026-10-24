// Fullscreen is a nicety: browsers refuse it (iPhone Safari, a missing user gesture), and the
// presentation works the same without it.
export const enterFullscreen = async (): Promise<void> => {
  try {
    await document.documentElement.requestFullscreen();
  } catch {
    // Not allowed here: the overlay still fills the window.
  }
};

export const leaveFullscreen = async (): Promise<void> => {
  if (!document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch {
    // Already left.
  }
};
